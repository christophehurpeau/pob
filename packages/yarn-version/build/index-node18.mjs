import fs$1 from 'node:fs';
import { program, Option } from 'commander';
import path from 'node:path';
import '@conventional-changelog/git-client';
import { addConfig, Logger, Level } from 'nightingale';
import { ConsoleHandler } from 'nightingale-console';
import 'semver';
import 'node:stream/consumers';
import 'conventional-changelog-core';
import 'conventional-changelog-preset-loader';
import childProcess from 'node:child_process';
import '@octokit/rest';
import fs from 'node:fs/promises';
import '@npmcli/map-workspaces';
import '@pob/pretty-pkg';

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

async function execvp(command, args, {
  cwd = process.cwd(),
  env = process.env,
  encoding,
  strict,
  stdo = "pipe"
}) {
  const stdoutChunks = [];
  const stderrChunks = [];
  if (env.PWD !== void 0) {
    env = { ...env, PWD: cwd };
  }
  const subprocess = childProcess.spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", stdo, stdo]
  });
  subprocess.stdout?.on("data", (chunk) => {
    stdoutChunks.push(chunk);
  });
  subprocess.stderr?.on("data", (chunk) => {
    stderrChunks.push(chunk);
  });
  return new Promise((resolve, reject) => {
    subprocess.on("error", (err) => {
      reject(new Error(`Process ${command} failed to spawn`));
    });
    subprocess.on("close", (code, signal) => {
      const chunksToString = (chunks) => stdo === "inherit" ? "" : Buffer.concat(chunks).toString(encoding ?? "utf8");
      const stdout = chunksToString(stdoutChunks);
      const stderr = chunksToString(stderrChunks);
      if (code === 0 || !strict) {
        resolve({
          code,
          signal,
          stdout,
          stderr
        });
      } else {
        reject(
          new Error(
            `Process ${[command, ...args].join(" ")} exited ${code !== null ? `with code ${code}` : `with signal ${signal || ""}`}:
stdout: ${stdout.toString()}
stderr: ${stderr.toString()}`
          )
        );
      }
    });
  });
}
const execCommand = (workspace, commandAndArgs = [], stdo = "pipe") => {
  const [command, ...args] = commandAndArgs;
  return execvp(command, args, {
    cwd: workspace.cwd,
    strict: true,
    stdo
  });
};

const isAccessible = (path2) => fs.access(path2).then(
  () => true,
  () => false
);
const findRootWorkspace = async (cwd) => {
  let currentPath = cwd;
  do {
    const isRootIfOneOfThesePathsExists = await Promise.all([
      isAccessible(path.join(currentPath, ".yarnrc.yml")),
      isAccessible(path.join(currentPath, "yarn.lock"))
    ]);
    if (isRootIfOneOfThesePathsExists.some(Boolean)) {
      return createWorkspace(currentPath);
    }
    currentPath = path.dirname(currentPath);
  } while (currentPath && currentPath !== "/");
  return null;
};
const getPackageJsonPath = (cwd) => path.join(cwd, "package.json");
const createWorkspace = async (path2) => {
  const pkg = await readPkg(path2);
  return { cwd: path2, pkg };
};
async function readPkg(cwd) {
  const packagePath = getPackageJsonPath(cwd);
  const pkg = await fs.readFile(packagePath, "utf8").catch((error) => {
    throw new Error(
      `Failed to read package.json in "${cwd}": ${error instanceof Error ? error.message : String(error)}`
    );
  });
  try {
    return JSON.parse(pkg);
  } catch (error) {
    throw new Error(
      `Failed to parse package.json in "${cwd}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const versionCommandAction = async (options, { nightingaleHandler = new ConsoleHandler(Level.INFO) } = {}) => {
  if (options.json) {
    process.env.NIGHTINGALE_CONSOLE_FORMATTER = "json";
  }
  addConfig({
    pattern: /^yarn-version/,
    handler: nightingaleHandler
  });
  new Logger("yarn-version");
  const rootWorkspace = await (options.cwdIsRoot ? createWorkspace(options.cwd) : findRootWorkspace(options.cwd));
  if (!rootWorkspace) {
    throw new UsageError("Could not find root workspace from this path.");
  }
  await execCommand(rootWorkspace, ["yarn", "install"], "inherit");
  return;
};
const Defaults = {
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
  verbose: false
};
program.command("version").usage("Bump package version using conventional commit").addOption(
  new Option("--includes-root", "Release root workspace [untested]").default(
    Defaults.includesRoot
  )
).addOption(new Option("--cwd", "working directory").default(process.cwd())).addOption(
  new Option(
    "--dry-run",
    "Print the versions without actually generating the package archive"
  ).default(Defaults.dryRun)
).addOption(new Option("-v,--verbose").default(Defaults.verbose)).addOption(
  new Option("--force <type>", "Specify the release type").choices([
    "major",
    "minor",
    "patch"
  ])
).addOption(
  new Option(
    "--prerelease [releaseType]",
    "Add a prerelease identifier to new versions"
  )
).addOption(
  new Option(
    "--preset <presetName>",
    "Conventional Changelog preset to require. Defaults to conventional-changelog-conventionalcommits."
  ).default("conventional-changelog-conventionalcommits")
).addOption(
  new Option("--tag-version-prefix <prefix>", "Tag version prefix").default(
    Defaults.tagVersionPrefix
  )
).addOption(
  new Option(
    "--changelog <path>",
    "Changelog path. Default to CHANGELOG.md."
  ).default(Defaults.changelog)
).addOption(
  new Option(
    "-m,--commit-message <message>",
    'Commit message. Default to "chore: release %a". You can use %v for the version, %s for the version with prefix, %t to list tags, %a for auto best display.'
  ).default(Defaults.commitMessage)
).addOption(
  new Option("--create-release <type>", "Create a release").choices([
    "github"
  ])
).addOption(
  new Option(
    "--bump-dependents-highest-as <type>",
    "Bump dependents highest version as major, minor or patch"
  ).choices(["major", "minor", "patch"]).default(Defaults.bumpDependentsHighestAs)
).addOption(
  new Option(
    "--always-bump-peer-dependencies",
    "Always bump peer dependencies. Default to bumping only if the version doesn't satisfies the peer dependency range."
  ).default(Defaults.alwaysBumpPeerDependencies)
).addOption(
  new Option(
    "--git-remote <remote-name>",
    "Git remote to push commits and tags to"
  ).default(Defaults.gitRemote)
).addOption(
  new Option(
    "--ignore-changes <glob>",
    'Ignore changes in files matching the glob. Example: "**/*.test.js"'
  )
).action((options) => versionCommandAction(options));

const pkg = JSON.parse(
  // eslint-disable-next-line unicorn/prefer-json-parse-buffer
  fs$1.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
program.name(pkg.name).description(pkg.description).version(pkg.version);
program.parse();
//# sourceMappingURL=index-node18.mjs.map
