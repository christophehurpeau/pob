/* eslint-disable complexity */

import { Option, program } from "commander";
import { LoggerCLI } from "nightingale";
import { satisfies } from "semver";
import {
  autoDetectPackageManager,
  getPackageManager,
} from "../pm/PackageManager.ts";
import { UsageError } from "../utils/UsageError.ts";
import type { BumpType } from "../utils/bumpTypeUtils.ts";
import {
  calcBumpRange,
  calcBumpType,
  getHighestBumpType,
  incrementVersion,
} from "../utils/bumpTypeUtils.ts";
import {
  createCommitsParser,
  generateChangelog,
  recommendBump,
} from "../utils/conventionalChangelogUtils.ts";
import { loadConventionalCommitConfig } from "../utils/conventionalCommitConfigUtils.ts";
import { asyncIterableToArray } from "../utils/generatorUtils.ts";
import type { GitTagVersion } from "../utils/gitUtils.ts";
import {
  createGitCommit,
  createGitTag,
  getDirtyFiles,
  getGitCommits,
  getGitCurrentBranch,
  getGitLatestTagVersion,
  isBehindRemote,
  pushCommitsAndTags,
} from "../utils/gitUtils.ts";
import {
  createGhRelease,
  ensureGhCliAvailable,
  parseGithubRepoUrl,
} from "../utils/githubUtils.ts";
import {
  PackageDependencyDescriptorUtils,
  PackageDescriptorNameUtils,
} from "../utils/packageDependenciesUtils.ts";
import type { PackageDependencyDescriptor } from "../utils/packageDependenciesUtils.ts";
import type { Workspace } from "../utils/packageUtils.ts";
import {
  createProjectWorkspace,
  createWorkspace,
  findRootWorkspace,
  writePkg,
} from "../utils/packageUtils.ts";
import { updateChangelogFile } from "../utils/updateChangelog.ts";
import type { DependencyType } from "../utils/workspaceUtils.ts";
import {
  buildDependenciesMaps,
  buildTopologicalOrderBatches,
  getWorkspaceName,
} from "../utils/workspaceUtils.ts";

export interface VersionCommandOptions {
  cwd: string;
  includesRoot: boolean;
  dryRun: boolean;
  force?: "major" | "minor" | "patch";
  prerelease?: string;
  json: boolean;
  preset: string;
  tagVersionPrefix: string;
  changelog: string;
  commitMessage: string;
  createRelease: boolean;
  bumpDependentsHighestAs: "major" | "minor" | "patch";
  alwaysBumpPeerDependencies: boolean;
  gitRemote: string;
  ignoreChanges?: string;
  verbose?: boolean;
  cwdIsRoot?: boolean;
  packageManager?: "bun" | "yarn";
  publish?: boolean;
}

interface BumpableWorkspace {
  workspace: Workspace;
  previousTag?: string;
  workspaceName: string;
  isRoot: boolean;
  version: string;
}

interface ChangedWorkspace {
  bumpReason?: string;
  bumpType: BumpType;
}

interface NoVersionToUpdateWorkspace {
  // for legacy configuration not using workspaces ranges https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
  dependenciesToBump: [DependencyType, PackageDependencyDescriptor, string][];
}

interface BumpedWorkspace extends ChangedWorkspace, NoVersionToUpdateWorkspace {
  bumpForDependenciesReasons?: string[];
  hasChanged: boolean;
  currentVersion: string;
  newVersion: string;
  newTag: string | null;
}

const todayInYYYYMMDD = (): string => {
  // sv-SEis used for yyyy-mm-dd format
  const dateFormatter = Intl.DateTimeFormat("sv-SE", {
    timeZone: "UTC",
  });
  return dateFormatter.format(new Date());
};

export const versionCommandAction = async (
  options: VersionCommandOptions,
  { logger = new LoggerCLI("@pob/version", { json: options.json }) } = {},
): Promise<void> => {
  const rootWorkspace = await (options.cwdIsRoot
    ? createWorkspace(options.cwd)
    : findRootWorkspace(options.cwd));

  if (!rootWorkspace) {
    throw new UsageError("Could not find root workspace from this path.");
  }

  const packageManager = options.packageManager
    ? getPackageManager(rootWorkspace, options.packageManager)
    : autoDetectPackageManager(rootWorkspace);

  const project = await createProjectWorkspace(rootWorkspace);

  if (!options.dryRun) {
    const dirtyFiles = await getDirtyFiles(project.root);
    if (dirtyFiles) {
      throw new Error(
        `Dirty Files:\n${dirtyFiles}\n\nThere are uncommitted changes in the git repository. Please commit or stash them first.`,
      );
    }
  }

  const rootWorkspaceChildren = [...project.children.values()];
  let rootNewVersion = "";
  let rootNewTag = "";
  const isMonorepo = rootWorkspaceChildren.length > 0;
  const isMonorepoVersionIndependent = isMonorepo && !rootWorkspace.pkg.version;
  const workspaces =
    !(isMonorepo && !rootWorkspaceChildren) || options.includesRoot
      ? [rootWorkspace, ...rootWorkspaceChildren]
      : rootWorkspaceChildren;

  if (options.prerelease) {
    throw new UsageError("--prerelease is not supported yet.");
  }
  if (options.ignoreChanges) {
    throw new UsageError("--ignore-changes is not supported yet.");
  }

  const [conventionalCommitConfig, parsedRepoUrl, gitCurrentBranch] =
    await Promise.all([
      loadConventionalCommitConfig(rootWorkspace, options.preset),
      options.createRelease ? parseGithubRepoUrl(rootWorkspace) : undefined,
      getGitCurrentBranch(rootWorkspace),
      // ensure gh CLI is available early to fail fast if necessary
      options.createRelease ? ensureGhCliAvailable(rootWorkspace) : undefined,
    ]);

  const rootPreviousVersionTagPromise =
    options.force || isMonorepoVersionIndependent
      ? null
      : getGitLatestTagVersion(rootWorkspace, {
          prefix: options.tagVersionPrefix,
          skipUnstable: true,
        });

  const buildTagName = (workspace: Workspace, version: string): string =>
    `${
      isMonorepo && workspace !== rootWorkspace
        ? `${getWorkspaceName(workspace)}@`
        : options.tagVersionPrefix
    }${version}`;

  const changedWorkspaces = new Map<Workspace, ChangedWorkspace>();
  const dependenciesMap = isMonorepo ? buildDependenciesMaps(project) : null;

  const bumpableWorkspaces: BumpableWorkspace[] = [];

  logger.group(
    options.force
      ? "Check all workspaces (force option)"
      : "Finding changed workspaces",
    () => {
      // check workspaces and create bumpableWorkspaces

      for (const workspace of workspaces) {
        const workspaceName = getWorkspaceName(workspace);
        const isRoot = workspace === rootWorkspace;
        if (isRoot && isMonorepo && isMonorepoVersionIndependent) continue;

        const version = workspace.pkg.version;

        if (!version || version === "0.0.0") {
          if (
            (isRoot || isMonorepoVersionIndependent) &&
            (!isMonorepo || !isMonorepoVersionIndependent)
          ) {
            throw new UsageError(
              'package.json has no version in its manifest. For the first release, set to "1.0.0-pre" or "0.1.0-pre".',
            );
          }

          logger.info(`${workspaceName}: skipped (no version)`);
          continue;
        }

        bumpableWorkspaces.push({
          workspace,
          workspaceName,
          isRoot,
          version,
        });
      }

      if (bumpableWorkspaces.length > 0) {
        logger.info("Found bumpable workspaces", {
          count: bumpableWorkspaces.length,
        });
      }
    },
  );

  const previousTagVersionByWorkspace = new Map<
    Workspace,
    GitTagVersion | null
  >(
    await Promise.all(
      bumpableWorkspaces.map(async ({ workspace, workspaceName, isRoot }) => {
        const packageOption =
          isMonorepo && isMonorepoVersionIndependent
            ? workspaceName
            : undefined;

        const tagPrefix = packageOption
          ? `${packageOption}@`
          : options.tagVersionPrefix;

        const previousTagAndVersion = await (isRoot ||
        !isMonorepoVersionIndependent
          ? rootPreviousVersionTagPromise
          : getGitLatestTagVersion(rootWorkspace, {
              path: workspace.relativeCwd,
              prefix: tagPrefix,
              skipUnstable: true,
            }));

        return [workspace, previousTagAndVersion] as const;
      }),
    ),
  );

  if (options.dryRun) {
    logger.info("Previous tags", {
      previousTagByWorkspace: Object.fromEntries(
        [...previousTagVersionByWorkspace.entries()].map(
          ([workspace, previousTagVersion]) => [
            getWorkspaceName(workspace),
            previousTagVersion?.tag,
          ],
        ),
      ),
    });
  }

  const parseCommits = createCommitsParser(conventionalCommitConfig);

  const commitsByWorkspace = options.force
    ? undefined
    : new Map(
        await Promise.all(
          bumpableWorkspaces.map(async ({ workspace }) => {
            const previousTagVersion =
              previousTagVersionByWorkspace.get(workspace);

            const commits = await asyncIterableToArray(
              parseCommits(
                getGitCommits(rootWorkspace, {
                  path: workspace.relativeCwd,
                  from: previousTagVersion?.tag || undefined,
                }),
              ),
            );

            return [workspace, commits] as const;
          }),
        ),
      );

  await logger.group("Finding changed workspaces", async () => {
    for (const { workspace, workspaceName } of bumpableWorkspaces) {
      let bumpType: BumpType | null = null;
      let bumpReason: string | undefined;

      if (options.force) {
        bumpType = options.force;
        bumpReason = "forced by --force flag";
      } else {
        const commits = commitsByWorkspace?.get(workspace);

        // No changes found for this package
        if (!commits || commits.length === 0) {
          logger.info(`${workspaceName}: skipped (no changes)`);
          continue;
        }

        const { releaseType, reason } = await recommendBump(
          commits,
          conventionalCommitConfig,
        );
        bumpReason = reason;

        if (releaseType) {
          bumpType = releaseType as BumpType;
        }
      }

      if (bumpType) {
        if (isMonorepo && !workspace.pkg.name) {
          throw new Error("Workspace name is required");
        }

        const currentVersion = workspace.pkg.version;

        if (!currentVersion) {
          throw new UsageError(
            `Invalid "${getWorkspaceName(workspace)}" version`,
          );
        }

        changedWorkspaces.set(workspace, {
          bumpType,
          bumpReason,
        });
      }
    }

    if (changedWorkspaces.size === 0) {
      logger.info("No changed workspaces");
    }
  });

  const bumpedWorkspaces = new Map<Workspace, BumpedWorkspace>();
  const noVersionToUpdateWorkspaces = new Map<
    Workspace,
    NoVersionToUpdateWorkspace
  >();
  const batches = dependenciesMap
    ? buildTopologicalOrderBatches(project, dependenciesMap)
    : [[rootWorkspace]];

  logger.group("Preparing bumping", () => {
    for (const batch of batches) {
      for (const workspace of batch) {
        const currentVersion = workspace.pkg.version;

        if (!currentVersion && !workspace.pkg.private) {
          throw new UsageError(
            `Invalid "${getWorkspaceName(workspace)}" version`,
          );
        }

        const changedWorkspace = changedWorkspaces.get(workspace);
        let bumpType: BumpType | null = null;
        const bumpReasons: string[] = [];
        const dependenciesToBump: BumpedWorkspace["dependenciesToBump"] = [];

        if (changedWorkspace) {
          bumpType = changedWorkspace.bumpType;
          bumpReasons.push(changedWorkspace.bumpReason || "by commits");
        }

        const dependencies = dependenciesMap?.get(workspace);

        if (dependencies) {
          for (const [
            dependencyWorkspace,
            dependencyType,
            dependencyDescriptor,
          ] of dependencies) {
            const dependencyBumpedWorkspace =
              bumpedWorkspaces.get(dependencyWorkspace);

            if (!dependencyBumpedWorkspace) {
              continue;
            }

            if (
              dependencyType === "peerDependencies" &&
              !options.alwaysBumpPeerDependencies &&
              // skip when peerdependency with a new version satisfied by the existing range.
              satisfies(
                dependencyBumpedWorkspace.newVersion,
                dependencyDescriptor.selector,
                { includePrerelease: true },
              )
            ) {
              continue;
            }

            const newRange = calcBumpRange(
              workspace,
              dependencyDescriptor.selector,
              dependencyBumpedWorkspace.newVersion,
            );

            if (
              dependencyDescriptor.selector === newRange &&
              newRange !== "workspace:*"
            ) {
              continue;
            }

            dependenciesToBump.push([
              dependencyType,
              dependencyDescriptor,
              newRange,
            ]);

            bumpType = getHighestBumpType([
              bumpType ?? "patch",
              calcBumpType(
                dependencyBumpedWorkspace.bumpType,
                options.bumpDependentsHighestAs,
              ),
            ]);

            bumpReasons.push(
              `Version bump for dependency: ${PackageDescriptorNameUtils.stringify(dependencyDescriptor.name)}`,
            );
          }
        }

        const workspaceName = getWorkspaceName(workspace);
        if (!currentVersion) {
          logger.info(`${workspaceName}: skipped (no version)`);
          if (workspace !== rootWorkspace) {
            noVersionToUpdateWorkspaces.set(workspace, {
              dependenciesToBump,
            });
          }
        } else if (!bumpType) {
          logger.info(
            `${workspaceName}: skipped (${
              changedWorkspace
                ? `no bump recommended by ${options.preset}`
                : "no changes"
            })`,
          );
        } else {
          const newVersion = incrementVersion(
            workspace,
            currentVersion,
            bumpType,
          );

          const tagName = buildTagName(workspace, newVersion);

          if (workspace === rootWorkspace) {
            rootNewVersion = newVersion;
            rootNewTag = tagName;
          }

          if (workspace !== rootWorkspace || !isMonorepo) {
            const bumpReason = bumpReasons.join("\n");
            bumpedWorkspaces.set(workspace, {
              currentVersion,
              bumpType,
              bumpReason,
              bumpForDependenciesReasons: changedWorkspace
                ? bumpReasons.slice(1)
                : bumpReasons,
              newVersion,
              newTag: tagName,
              hasChanged: changedWorkspace !== undefined,
              dependenciesToBump,
            });

            logger.info(
              `${workspaceName}: ${currentVersion} -> ${
                !isMonorepo || isMonorepoVersionIndependent
                  ? newVersion
                  : "bump"
              } (${bumpReason.replaceAll("\n", " ; ")})`,
            );
            // TODO Json only:
            // logger.info({
            //   cwd: npath.fromPortablePath(workspace.cwd),
            //   ident: workspaceName,
            //   oldVersion: currentVersion,
            //   ...(isMonorepoVersionIndependent ? { newVersion } : {}),
            //   bumpType,
            //   bumpReasons,
            // });
          }
        }
      }
    }
  });

  // TODO ask for confirmation
  // if (!this.yes) {
  // }

  // TODO do this entire phase here, not override for not independent only
  if (isMonorepo && !isMonorepoVersionIndependent) {
    const currentVersion = rootWorkspace.pkg.version!;
    const highestBumpType = getHighestBumpType(
      [...bumpedWorkspaces.values()].map(({ bumpType }) => bumpType),
    );
    const newVersion = incrementVersion(
      rootWorkspace,
      currentVersion,
      highestBumpType,
    );
    rootNewVersion = newVersion;
    rootNewTag = buildTagName(rootWorkspace, newVersion);

    [...bumpedWorkspaces.entries()].forEach(([workspace, bumpedWorkspace]) => {
      const isRoot = workspace === rootWorkspace;
      if (isRoot) {
        throw new Error("Unexpected root found in bumped workspaces");
      }
      bumpedWorkspace.bumpType = highestBumpType;
      bumpedWorkspace.newVersion = newVersion;
      bumpedWorkspace.newTag = null;
    });

    [
      ...bumpedWorkspaces.entries(),
      ...noVersionToUpdateWorkspaces.entries(),
    ].forEach(([workspace, { dependenciesToBump }]) => {
      dependenciesToBump.forEach((dependencyToBump) => {
        dependencyToBump[2] = calcBumpRange(
          workspace,
          dependencyToBump[1].selector,
          newVersion,
        );
      });
    });

    bumpedWorkspaces.set(rootWorkspace, {
      currentVersion,
      bumpType: highestBumpType,
      hasChanged: true,
      newVersion: rootNewVersion,
      newTag: rootNewTag,
      dependenciesToBump: [],
    });

    logger.info(
      `${currentVersion} -> ${newVersion}`,
      // TODO Json only:
      // {
      //   oldVersion: currentVersion,
      //   newVersion, },
    );
  }

  await logger.group("Applying changes", async () => {
    // Update lockfile ; must be done to make sure preversion script can be ran

    if (!options.dryRun) {
      if (packageManager.installOnPackageContentChange) {
        logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
        await packageManager.installOnPackageContentChange(rootWorkspace);
      }

      logger.info("Lifecycle script: preversion");

      if (
        isMonorepoVersionIndependent &&
        rootWorkspace.pkg.scripts?.preversion
      ) {
        await packageManager.runScript(rootWorkspace, "preversion");
      }

      // lifecycle: preversion
      for (const workspace of bumpedWorkspaces.keys()) {
        if (workspace.pkg.scripts?.preversion) {
          await packageManager.runScript(workspace, "preversion");
        }
      }

      logger.info("Modifying versions in package.json");
      // update versions

      await Promise.all(
        [...bumpedWorkspaces.entries()].map(
          ([workspace, { newVersion, dependenciesToBump }]) => {
            workspace.pkg.version = newVersion;

            for (const [
              dependencyType,
              dependencyDescriptor,
              dependencyNewRange,
            ] of dependenciesToBump) {
              const newDescriptor = PackageDependencyDescriptorUtils.make(
                dependencyDescriptor,
                dependencyNewRange,
              );
              const [key, newValue] =
                PackageDependencyDescriptorUtils.stringify(newDescriptor);
              workspace.pkg[dependencyType]![key] = newValue;
            }

            return writePkg(workspace);
          },
        ),
      );

      if (packageManager.installOnPackageContentChange) {
        // Update lockfile ; must be done before running again lifecycle scripts
        logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
        await packageManager.installOnPackageContentChange(rootWorkspace);
      }

      // lifecycle: version
      logger.info("Lifecycle script: version");
      for (const workspace of bumpedWorkspaces.keys()) {
        if (workspace.pkg.scripts?.version) {
          await packageManager.runScript(workspace, "version");
        }
      }
    }

    if (isMonorepoVersionIndependent && rootWorkspace.pkg.scripts?.version) {
      await packageManager.runScript(rootWorkspace, "version");
    }
  });

  const changelogs = new Map<Workspace, string>();

  await Promise.all(
    [...bumpedWorkspaces.entries()].map(
      async ([
        workspace,
        { newTag, hasChanged, bumpReason, bumpForDependenciesReasons },
      ]) => {
        // const workspaceRelativePath =
        //   rootWorkspace === workspace
        //     ? undefined
        //     : path.relative(rootWorkspace.cwd, workspace.cwd);

        const commits = commitsByWorkspace?.get(workspace);

        let changelog = await generateChangelog(
          rootWorkspace,
          workspace.pkg,
          conventionalCommitConfig,
          previousTagVersionByWorkspace.get(workspace)?.tag || null,
          isMonorepoVersionIndependent ? newTag : rootNewTag,
          commits,
          todayInYYYYMMDD(),
          // {
          //   path: workspaceRelativePath,
          //   previousTag: previousTagByWorkspace.get(workspace) || undefined,
          //   verbose: options.verbose,
          //   tagPrefix: options.tagVersionPrefix,
          //   lernaPackage:
          //     rootWorkspace === workspace
          //       ? undefined
          //       : getWorkspaceName(workspace),
          // },
        );

        if (bumpForDependenciesReasons && workspace !== rootWorkspace) {
          if (bumpForDependenciesReasons.length > 0) {
            changelog += `${!changelog.endsWith("\n\n") ? "\n" : ""}${bumpForDependenciesReasons.join("\n")}\n\n`;
          }
        }

        if (changelog.slice(changelog.indexOf("\n")).trim().length === 0) {
          changelog += `${!changelog.endsWith("\n\n") ? "\n" : ""}Note: no notable changes\n\n`;
        }

        if (!changelog && rootWorkspace === workspace) {
          throw new Error("No changelog found for root workspace");
        }

        changelogs.set(workspace, changelog);

        if (options.changelog) {
          if (options.dryRun) {
            logger.info(
              `${getWorkspaceName(workspace)}: ${
                options.changelog
              }\n${changelog}`,
            );
          } else {
            await updateChangelogFile(
              changelog,
              options.tagVersionPrefix,
              `${workspace.cwd}/${options.changelog}`,
            );
          }
        }
      },
    ),
  );

  if (!options.dryRun) {
    logger.separator();

    if (packageManager.installOnPackageContentChange) {
      // install to update versions in lock file
      logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
      await packageManager.installOnPackageContentChange(rootWorkspace);
    }

    logger.separator();

    const changedFiles = await getDirtyFiles(project.root);

    if (changedFiles) {
      logger.info("Commit, tag and push", {
        changedFiles,
      });

      const tagsSet = new Set<string>(
        [...bumpedWorkspaces.values()]
          .map(({ newTag }) => newTag)
          .filter((newTag) => newTag !== null),
      );

      const tagsInCommitMessage = [...tagsSet]
        .map((tag) => `- ${tag}`)
        .join("\n");
      const message = options.commitMessage
        .replace(/\\n/g, "\n")
        .replace(
          /%a/g,
          isMonorepoVersionIndependent
            ? `\n\n${tagsInCommitMessage}`
            : rootNewVersion,
        )
        .replace(/%s/g, rootNewTag)
        .replace(/%v/g, rootNewVersion)
        .replace(/%t/g, tagsInCommitMessage);

      await createGitCommit(rootWorkspace, message);

      for (const [workspace, { newTag }] of bumpedWorkspaces.entries()) {
        if (newTag === null) continue;
        await createGitTag(workspace, newTag);
      }

      if (
        await isBehindRemote(rootWorkspace, options.gitRemote, gitCurrentBranch)
      ) {
        logger.error("Remote is ahead, aborting");
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }

      await pushCommitsAndTags(
        rootWorkspace,
        options.gitRemote,
        gitCurrentBranch,
      );

      // run postversion
      if (rootWorkspace.pkg.scripts?.postversion) {
        logger.info("Lifecycle script: postversion");
        await packageManager.runScript(rootWorkspace, "postversion");
      }

      // TODO open github PR

      if (options.createRelease && parsedRepoUrl) {
        logger.info("Create git release");

        await Promise.all(
          [...bumpedWorkspaces.entries()].map(([workspace, { newTag }]) => {
            if (newTag === null) return undefined;
            const changelog = changelogs.get(workspace);
            if (!changelog) {
              logger.warn(
                `No changelog found for workspace: ${getWorkspaceName(
                  workspace,
                )}`,
              );
              return undefined;
            }
            return createGhRelease(workspace, {
              parsedRepoUrl,
              tag: newTag,
              body: changelog,
              prerelease: !!options.prerelease,
            });
          }),
        );
      }

      if (!options.publish) {
        return;
      }
      await logger.group("Publishing packages", async () => {
        if (packageManager.publishWorkspaces) {
          await packageManager.publishWorkspaces(rootWorkspace);
        } else {
          for (const [workspace] of bumpedWorkspaces.entries()) {
            if (workspace.pkg.private) {
              logger.info(
                `Skipping private workspace ${getWorkspaceName(workspace)}`,
              );
              continue;
            }

            logger.info(`Publishing ${getWorkspaceName(workspace)}`);
            await packageManager.publish(workspace);
          }
        }
      });
    } else {
      logger.warn("No changes made. Nothing to commit.");
    }
  }
};

export const Defaults: VersionCommandOptions = {
  cwd: process.cwd(),
  includesRoot: false,
  dryRun: false,
  json: false,
  preset: "conventional-changelog-conventionalcommits",
  tagVersionPrefix: "v",
  changelog: "CHANGELOG.md",
  commitMessage: "chore: release %a",
  createRelease: false,
  bumpDependentsHighestAs: "major",
  alwaysBumpPeerDependencies: false,
  gitRemote: "origin",
  verbose: false,
  publish: false,
};

export default program
  .command("version", { isDefault: true })
  .usage("Bump package version using conventional commit")
  .addOption(
    new Option("--includes-root", "Release root workspace [untested]").default(
      Defaults.includesRoot,
    ),
  )
  .addOption(new Option("--cwd", "working directory").default(process.cwd()))
  .addOption(
    new Option(
      "--dry-run",
      "Print the versions without actually generating the package archive",
    ).default(Defaults.dryRun),
  )
  .addOption(new Option("-v,--verbose").default(Defaults.verbose))
  .addOption(
    new Option("--force <type>", "Specify the release type").choices([
      "major",
      "minor",
      "patch",
    ]),
  )
  .addOption(
    new Option(
      "--prerelease [releaseType]",
      "Add a prerelease identifier to new versions",
    ),
  )
  .addOption(
    new Option(
      "--preset <presetName>",
      "Conventional Changelog preset to require. Defaults to conventional-changelog-conventionalcommits.",
    ).default("conventional-changelog-conventionalcommits"),
  )
  .addOption(
    new Option("--tag-version-prefix <prefix>", "Tag version prefix").default(
      Defaults.tagVersionPrefix,
    ),
  )
  .addOption(
    new Option(
      "--changelog <path>",
      "Changelog path. Default to CHANGELOG.md.",
    ).default(Defaults.changelog),
  )
  .addOption(
    new Option(
      "-m,--commit-message <message>",
      'Commit message. Default to "chore: release %a". You can use %v for the version, %s for the version with prefix, %t to list tags, %a for auto best display.',
    ).default(Defaults.commitMessage),
  )
  .addOption(
    new Option("--create-release <type>", "Create a release").choices([
      "github",
    ]),
  )
  .addOption(
    new Option(
      "--bump-dependents-highest-as <type>",
      "Bump dependents highest version as major, minor or patch",
    )
      .choices(["major", "minor", "patch"])
      .default(Defaults.bumpDependentsHighestAs),
  )
  .addOption(
    new Option(
      "--always-bump-peer-dependencies",
      "Always bump peer dependencies. Default to bumping only if the version doesn't satisfies the peer dependency range.",
    ).default(Defaults.alwaysBumpPeerDependencies),
  )
  .addOption(
    new Option(
      "--git-remote <remote-name>",
      "Git remote to push commits and tags to",
    ).default(Defaults.gitRemote),
  )
  .addOption(
    new Option(
      "--ignore-changes <glob>",
      'Ignore changes in files matching the glob. Example: "**/*.test.js"',
    ),
  )
  .addOption(new Option("--json", "Logger json"))
  .addOption(
    new Option(
      "--package-manager <manager>",
      "Specify the package manager to use (bun or yarn). Autodetected if not specified.",
    ).choices(["bun", "yarn"]),
  )
  .addOption(new Option("--publish", "Publish after versioning").default(false))
  .action((options) => versionCommandAction(options));
