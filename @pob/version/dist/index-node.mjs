import fs$1, { existsSync } from 'node:fs';
import { program, Option } from 'commander';
import { LoggerCLI } from 'nightingale';
import semver, { satisfies } from 'semver';
import childProcess from 'node:child_process';
import path from 'node:path';
import { writeChangelogString } from 'conventional-changelog-writer';
import { parseCommits } from 'conventional-commits-parser';
import { loadPreset } from 'conventional-changelog-preset-loader';
import fs, { glob } from 'node:fs/promises';

async function execvp(command, args, {
  cwd = process.cwd(),
  env = process.env,
  encoding,
  strict,
  stdo = "pipe",
  input
}) {
  const stdoutChunks = [];
  const stderrChunks = [];
  if (env.PWD !== void 0) {
    env = { ...env, PWD: cwd };
  }
  const subprocess = childProcess.spawn(command, args, {
    cwd,
    env,
    stdio: [input ? "pipe" : "ignore", stdo, stdo]
  });
  if (input && subprocess.stdin) {
    subprocess.stdin.write(input);
    subprocess.stdin.end();
  }
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
stdout: ${stdout}
stderr: ${stderr}`
          )
        );
      }
    });
  });
}
async function* spawnStreamStdout(command, args, {
  cwd = process.cwd(),
  env = process.env,
  encoding,
  strict,
  separator
}) {
  const stderrChunks = [];
  if (env.PWD !== void 0) {
    env = { ...env, PWD: cwd };
  }
  const subprocess = childProcess.spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  subprocess.stderr.on("data", (chunk2) => {
    stderrChunks.push(chunk2);
  });
  let chunk;
  let payload;
  let buffer = "";
  for await (chunk of subprocess.stdout) {
    buffer += chunk.toString();
    if (buffer.includes(separator)) {
      payload = buffer.split(separator);
      buffer = payload.pop() || "";
      yield* payload;
    }
  }
  if (buffer) {
    yield buffer;
  }
  return new Promise((resolve, reject) => {
    subprocess.on("error", (err) => {
      reject(new Error(`Process ${command} failed to spawn`));
    });
    subprocess.on("close", (code, signal) => {
      const chunksToString = (chunks) => Buffer.concat(chunks).toString(encoding ?? "utf8");
      const stderr = chunksToString(stderrChunks);
      if (code === 0 || !strict) {
        resolve({
          code,
          signal,
          stderr
        });
      } else {
        reject(
          new Error(
            `Process ${[command, ...args].join(" ")} exited ${code !== null ? `with code ${code}` : `with signal ${signal || ""}`}:
stderr: ${stderr}`
          )
        );
      }
    });
  });
}
const execCommand = (workspace, commandAndArgs, stdo = "pipe") => {
  const [command, ...args] = commandAndArgs;
  if (command === void 0) {
    throw new Error("Command is required");
  }
  return execvp(command, args, {
    cwd: workspace.cwd,
    strict: true,
    stdo
  });
};
const execCommandWithInput = (workspace, commandAndArgs, input, stdo = "pipe") => {
  const [command, ...args] = commandAndArgs;
  if (command === void 0) {
    throw new Error("Command is required");
  }
  return execvp(command, args, {
    cwd: workspace.cwd,
    strict: true,
    stdo,
    input
  });
};
const execCommandStreamStdout = (workspace, commandAndArgs, separator = "\n") => {
  const [command, ...args] = commandAndArgs;
  if (command === void 0) {
    throw new Error("Command is required");
  }
  return spawnStreamStdout(command, args, {
    cwd: workspace.cwd,
    strict: true,
    separator
  });
};

const execCommand$1 = /*#__PURE__*/Object.defineProperty({
  __proto__: null,
  execCommand,
  execCommandStreamStdout,
  execCommandWithInput
}, Symbol.toStringTag, { value: 'Module' });

const BunPackageManager = {
  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["bun", "run", scriptName], "inherit");
  },
  async publish(workspace) {
    await execCommand(workspace, ["bun", "publish"], "inherit");
  }
};

const YarnPackageManager = {
  async installOnPackageContentChange(rootWorkspace) {
    await execCommand(rootWorkspace, ["yarn", "install"], "inherit");
  },
  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["yarn", "run", scriptName], "inherit");
  },
  async publish(workspace) {
    await execCommand(workspace, ["yarn", "npm", "publish"], "inherit");
  },
  async publishWorkspaces(rootWorkspace) {
    await execCommand(
      rootWorkspace,
      [
        "yarn",
        "workspaces",
        "foreach",
        "--all",
        "--parallel",
        "--no-private",
        "npm",
        "publish"
      ],
      "inherit"
    );
  }
};

const autoDetectPackageManager = (rootWorkspace) => {
  const hasYarnLock = existsSync(`${rootWorkspace.cwd}/yarn.lock`);
  const hasBunLockLegacy = existsSync(`${rootWorkspace.cwd}/bun.lockb`);
  const hasBunLock = existsSync(`${rootWorkspace.cwd}/bun.lock`);
  const hasNpmPackageLock = existsSync(
    `${rootWorkspace.cwd}/package-lock.json`
  );
  if ([hasYarnLock, hasBunLockLegacy, hasBunLock, hasNpmPackageLock].filter(
    Boolean
  ).length > 1) {
    throw new Error(
      `Multiple lock files detected in workspace at ${rootWorkspace.cwd}. Please ensure only one lock file is present, or pass --package-manager option to bypass auto-detection.`
    );
  }
  if (hasYarnLock) {
    return YarnPackageManager;
  }
  if (hasBunLockLegacy || hasBunLock) {
    return BunPackageManager;
  }
  if (hasNpmPackageLock) {
    throw new Error(
      "NPM is not currently supported as a package manager. Please migrate to Yarn or Bun, or open an issue to request support."
    );
  }
  throw new Error(
    `No lock file detected in workspace at ${rootWorkspace.cwd}. Please ensure a supported lock file is present, or pass --package-manager option to bypass auto-detection.`
  );
};
const getPackageManager = (rootWorkspace, specifiedPackageManager) => {
  if (specifiedPackageManager === "bun") {
    return BunPackageManager;
  }
  if (specifiedPackageManager === "yarn") {
    return YarnPackageManager;
  }
  throw new Error(
    "Invalid package manager specified. Supported values are 'bun' and 'yarn'."
  );
};

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

function getMapArrayItemForKey(map, key) {
  let value = map.get(key);
  if (value === void 0) {
    map.set(key, value = []);
  }
  return value;
}

const PackageDescriptorNameUtils = {
  parse: (value) => {
    if (value.startsWith("@")) {
      const [scope, name] = value.slice(1).split("/", 2);
      if (!scope || !name) {
        throw new Error(`Invalid package descriptor name: ${value}`);
      }
      return { scope, name };
    }
    return { name: value };
  },
  stringify: (descriptor) => {
    return descriptor.scope === void 0 ? descriptor.name : `@${descriptor.scope}/${descriptor.name}`;
  }
};
const PackageDependencyDescriptorUtils = {
  make: (descriptor, selector) => {
    return { key: descriptor.key, name: descriptor.name, selector };
  },
  parse: (dependencyKey, dependencyValue) => {
    const [name, selector] = dependencyValue.startsWith("npm:") ? (() => {
      const v = dependencyValue.slice("npm:".length);
      if (!v.startsWith("@")) return v.split("@", 2);
      const [packageNameWithoutFirstChar, selector2] = v.slice(1).split("@", 2);
      if (!packageNameWithoutFirstChar || !selector2) {
        throw new Error(`Invalid package descriptor: ${dependencyValue}`);
      }
      return [`@${packageNameWithoutFirstChar}`, selector2];
    })() : [dependencyKey, dependencyValue];
    return {
      key: dependencyKey,
      name: PackageDescriptorNameUtils.parse(name),
      selector
    };
  },
  stringify: (descriptor) => {
    return [descriptor.key, descriptor.selector];
  }
};

const allDependenciesTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies"
];
const getWorkspaceName = (workspace) => {
  return workspace.pkg.name ?? (path.basename(workspace.cwd) || "unnamed-workspace");
};
const buildDependenciesMaps = (project) => {
  const dependenciesMap = /* @__PURE__ */ new Map();
  for (const dependent of project.children.values()) {
    for (const set of allDependenciesTypes) {
      for (const [dependencyKey, dependencyValue] of Object.entries(
        dependent.pkg[set] || {}
      )) {
        if (!dependencyValue) continue;
        const descriptor = PackageDependencyDescriptorUtils.parse(
          dependencyKey,
          dependencyValue
        );
        const workspace = project.children.get(
          PackageDescriptorNameUtils.stringify(descriptor.name)
        );
        if (!workspace) continue;
        const dependencies = getMapArrayItemForKey(dependenciesMap, dependent);
        dependencies.push([workspace, set, descriptor]);
      }
    }
  }
  return dependenciesMap;
};
const buildTopologicalOrderBatches = (project, dependenciesMap) => {
  const batches = [];
  const added = /* @__PURE__ */ new Set();
  const toAdd = /* @__PURE__ */ new Set([
    project.root,
    ...project.children.values()
  ]);
  while (toAdd.size > 0) {
    const batch = /* @__PURE__ */ new Set();
    for (const workspace of toAdd) {
      if (workspace === project.root && toAdd.size > 1) {
        continue;
      }
      const dependencies = dependenciesMap.get(workspace);
      if (!dependencies || dependencies.every((w) => added.has(w[0]))) {
        batch.add(workspace);
      }
    }
    for (const workspace of batch) {
      added.add(workspace);
      toAdd.delete(workspace);
    }
    if (batch.size === 0) {
      throw new Error("Circular dependency detected");
    }
    batches.push([...batch]);
  }
  return batches;
};

const SUPPORTED_UPGRADE_REGEXP = (
  // eslint-disable-next-line regexp/no-unused-capturing-group
  /^((?:>=|[~^])?)(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(\.(0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*)?(\+[0-9a-z-]+(\.[0-9a-z-]+)*)?$/i
);
const yarnWorkspaceProtocol = "workspace:";
const calcBumpRange = (workspace, range, newVersion) => {
  if (range === "*") {
    return range;
  }
  let useWorkspaceProtocol = false;
  if (range.startsWith(yarnWorkspaceProtocol)) {
    const slicedRange = range.slice(yarnWorkspaceProtocol.length);
    if (slicedRange === workspace.relativeCwd) {
      return range;
    }
    if (slicedRange === "*") {
      return range;
    }
    range = slicedRange;
    useWorkspaceProtocol = true;
  }
  const parsed = SUPPORTED_UPGRADE_REGEXP.exec(range);
  if (!parsed) {
    const workspaceName = getWorkspaceName(workspace);
    throw new Error(`Couldn't bump range ${range} in ${workspaceName}`);
  }
  return `${useWorkspaceProtocol ? yarnWorkspaceProtocol : ""}${parsed[1] ?? ""}${newVersion}`;
};
const getHighestBumpType = (bumpTypes) => {
  if (bumpTypes.includes("major")) {
    return "major";
  }
  if (bumpTypes.includes("minor")) {
    return "minor";
  }
  return "patch";
};
const calcBumpType = (bumpType, maxBumpType) => {
  if (maxBumpType === "major") {
    return bumpType;
  }
  if (maxBumpType === "minor") {
    return bumpType === "major" || bumpType === "minor" ? "minor" : "patch";
  }
  return "patch";
};
const incVersion = (version, bumpType) => {
  if (bumpType === "major" && semver.major(version) === 0) {
    bumpType = "minor";
  }
  return semver.inc(version, bumpType);
};
const incrementVersion = (workspace, currentVersion, bumpType) => {
  const newVersion = incVersion(currentVersion, bumpType);
  if (!newVersion) {
    throw new UsageError(
      `Could not determine next version for "${getWorkspaceName(
        workspace
      )}" (currentVersion: ${currentVersion}, bumpType: ${bumpType}})`
    );
  }
  return newVersion;
};

const versions = [
  "major",
  "minor",
  "patch"
];
const recommendBump = async (commits, config) => {
  const whatBump = config.whatBump;
  if (!whatBump) {
    throw new Error("whatBump method is missing in config");
  }
  const result = { ...await whatBump(commits) };
  return {
    ...result,
    releaseType: result.level != null ? versions[result.level] : void 0
  };
};
const generateChangelog = (workspace, pkg, config, previousTag, newTag, commits, date) => {
  if (!newTag) {
    throw new Error(`Missing new tag for package "${pkg.name ?? ""}"`);
  }
  const originUrl = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  const match = originUrl && typeof originUrl === "string" && /^(?:git@|https?:\/\/)(?:([^./:]+(?:\.com)?)[/:])?([^/:]+)\/([^./:]+)(?:.git)?/.exec(
    originUrl
  );
  const [, gitHost, gitAccount, repoName] = match || [
    void 0,
    void 0,
    void 0,
    void 0
  ];
  return writeChangelogString(
    commits ?? [],
    {
      // @ts-expect-error - missing types
      previousTag,
      currentTag: newTag,
      linkCompare: previousTag != null,
      version: pkg.version,
      host: gitHost ? `https://${gitHost}` : void 0,
      owner: gitAccount,
      repository: repoName,
      date
    },
    // @ts-expect-error - missing types
    config.writer
  );
};
const createCommitsParser = (config) => {
  return parseCommits(config.parser);
};

const loadConventionalCommitConfig = async (rootWorkspace, preset) => {
  try {
    return await loadPreset(preset);
  } catch (error) {
    throw new UsageError(
      `Failed to require preset "${preset}": ${error.message}`
    );
  }
};

async function asyncIterableToArray(asyncIterable) {
  const result = [];
  for await (const value of asyncIterable) {
    result.push(value);
  }
  return result;
}

const getGitCurrentBranch = async (workspace) => {
  const { stdout } = await execCommand(workspace, [
    "git",
    "rev-parse",
    "--abbrev-ref",
    "HEAD"
  ]);
  const currentBranch = stdout.trim();
  if (currentBranch === "HEAD") {
    throw new UsageError("HEAD is detached. Please checkout a branch.");
  }
  return currentBranch;
};
const createGitCommit = async (workspace, commitMessage) => {
  await execCommand(workspace, ["git", "add", "-A"]);
  await execCommand(workspace, [
    "git",
    "commit",
    "--no-verify",
    "-m",
    commitMessage
  ]);
};
const createGitTag = async (workspace, newTag) => {
  await execCommand(workspace, ["git", "tag", newTag, "-m", newTag]);
};
const pushCommitsAndTags = async (workspace, gitRemote, currentBranch) => {
  await execCommand(workspace, [
    "git",
    "push",
    "--follow-tags",
    "--no-verify",
    "--atomic",
    gitRemote,
    currentBranch
  ]);
};
const isBehindRemote = async (workspace, gitRemote, currentBranch) => {
  await execCommand(workspace, ["git", "remote", "update", gitRemote]);
  const { stdout } = await execCommand(workspace, [
    "git",
    "rev-list",
    "--left-right",
    "--count",
    `${gitRemote}/${currentBranch}..${currentBranch}`
  ]);
  const [behind] = stdout.split("	").map((val) => parseInt(val, 10));
  return behind ? behind > 0 : false;
};
const getDirtyFiles = async (workspace) => {
  const { stdout: dirtyFiles } = await execCommand(workspace, [
    "git",
    "status",
    "--porcelain"
  ]);
  return dirtyFiles;
};
const toArray = (input) => Array.isArray(input) ? input : [input];
const getGitLatestTagVersion = async (workspace, {
  prefix,
  skipUnstable,
  since,
  from = "",
  to = "HEAD",
  path
} = {}) => {
  const tagRegex = /tag:\s*(.+?)[,)]/gi;
  for await (const chunk of execCommandStreamStdout(workspace, [
    "git",
    "log",
    "--no-color",
    "--date-order",
    "--format=%d",
    ...since ? [`--since=${since instanceof Date ? since.toISOString() : since}`] : [],
    [from, to].filter(Boolean).join(".."),
    ...path ? ["--", ...toArray(path)] : []
  ])) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const matches = trimmed.matchAll(tagRegex);
    for (const match of matches) {
      const tag = match[1];
      if (!tag) continue;
      if (prefix && !tag.startsWith(prefix)) {
        continue;
      }
      const version = prefix ? tag.slice(prefix.length) : tag;
      if (!semver.valid(version)) {
        continue;
      }
      if (skipUnstable && semver.prerelease(version)) {
        continue;
      }
      return { tag, version };
    }
  }
  return null;
};
const GIT_COMMIT_SEPARATOR = "------------------------ >8 ------------------------";
const getGitCommits = (workspace, {
  path,
  from = "",
  to = "HEAD",
  format = "%B",
  reverse,
  merges,
  since
} = {}) => {
  return execCommandStreamStdout(
    workspace,
    [
      "git",
      "log",
      `--format=${format}%n${GIT_COMMIT_SEPARATOR}`,
      ...since ? [`--since=${since instanceof Date ? since.toISOString() : since}`] : [],
      ...reverse ? ["--reverse"] : [],
      ...merges ? ["--merges"] : [],
      ...merges === false ? ["--no-merges"] : [],
      [from, to].filter(Boolean).join(".."),
      ...path ? ["--", ...toArray(path)] : []
    ],
    GIT_COMMIT_SEPARATOR
  );
};

async function ensureGhCliAvailable(workspace) {
  const { GH_TOKEN } = process.env;
  if (!GH_TOKEN) {
    throw new UsageError('"GH_TOKEN" environment variable required');
  }
  try {
    const { execCommand } = await Promise.resolve().then(() => execCommand$1);
    await execCommand(workspace, ["gh", "--version"]);
  } catch {
    throw new UsageError(
      'The "gh" CLI is required. Please install GitHub CLI: https://cli.github.com/'
    );
  }
}
const githubRegex = /^https?:\/\/github.com\/([^#/]+)\/([^#/]+?)(?:\.git)?$/;
const parseGithubRepoUrl = (workspace) => {
  const repository = workspace.pkg.repository;
  const url = typeof repository === "string" ? repository : repository?.url;
  if (!url) {
    throw new Error(
      "No repository URL found in manifest. Please add one and try again. https://docs.npmjs.com/cli/v9/configuring-npm/package-json#repository"
    );
  }
  const match = githubRegex.exec(url);
  if (!match) {
    throw new Error(`Invalid GitHub repository URL: "${url}"`);
  }
  const [, username, reponame] = match;
  if (!username || !reponame) {
    throw new Error(`Invalid GitHub repository URL: "${url}"`);
  }
  return { username, reponame };
};
const extractHostnameFromGheApiUrl = (gheApiUrl) => {
  try {
    const url = new URL(gheApiUrl);
    return url.hostname || null;
  } catch {
    const m = /^https?:\/\/([^/]+)/.exec(gheApiUrl);
    return m?.[1] || null;
  }
};
const createGhRelease = async (workspace, opts) => {
  const { parsedRepoUrl, tag, body, prerelease } = opts;
  const { GH_TOKEN, GHE_API_URL } = process.env;
  if (!GH_TOKEN) {
    await ensureGhCliAvailable(workspace);
    return;
  }
  const args = [
    "release",
    "create",
    tag,
    "--repo",
    `${parsedRepoUrl.username}/${parsedRepoUrl.reponame}`
  ];
  if (prerelease) {
    args.push("--prerelease");
  }
  if (GHE_API_URL) {
    const hostname = extractHostnameFromGheApiUrl(GHE_API_URL);
    if (hostname) {
      args.push("--hostname", hostname);
    }
  }
  try {
    await execCommandWithInput(
      workspace,
      ["gh", ...args, "--notes-file", "-"],
      body
    );
  } catch (error) {
    throw new Error(
      `gh release create failed: ${String(error instanceof Error ? error.message : error)}`
    );
  }
};

async function mapWorkspacesFromPkg({
  cwd,
  pkg
}) {
  const workspacesPatterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages || [];
  const map = /* @__PURE__ */ new Map();
  for (const pattern of workspacesPatterns) {
    const normalized = pattern.endsWith("package.json") ? pattern : `${pattern.replace(/\/*$/, "")}/package.json`;
    const files = glob(normalized, { cwd });
    for await (const file of files) {
      const packageDir = path.join(cwd, path.dirname(file));
      const packageJson = await readPkg(packageDir);
      const workspaceName = packageJson.name || path.basename(packageDir);
      if (map.has(workspaceName)) {
        const existingWorkspace = map.get(workspaceName);
        if (existingWorkspace && existingWorkspace.cwd !== packageDir) {
          throw new Error(
            `must not have multiple workspaces with the same name
package '${workspaceName}' has conflicts in the following paths:
    ${existingWorkspace.cwd}
    ${packageDir}`
          );
        }
        if (existingWorkspace && existingWorkspace.cwd === packageDir) continue;
      }
      map.set(workspaceName, { cwd: packageDir, pkg: packageJson });
    }
  }
  return map;
}
const createProjectWorkspace = async (root) => {
  const map = root.pkg.workspaces ? await mapWorkspacesFromPkg({ cwd: root.cwd, pkg: root.pkg }) : /* @__PURE__ */ new Map();
  const children = new Map(
    [...map.entries()].map(([packageName, workspace]) => {
      const w = {
        ...workspace,
        relativeCwd: path.relative(root.cwd, workspace.cwd)
      };
      return [packageName, w];
    })
  );
  return { root, children };
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
      isAccessible(path.join(currentPath, "yarn.lock")),
      isAccessible(path.join(currentPath, "bun.lock"))
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
async function writePkg(workspace) {
  const string = `${JSON.stringify(workspace.pkg, null, 2)}
`;
  await fs.writeFile(getPackageJsonPath(workspace.cwd), string, "utf8");
}
async function readPkg(cwd) {
  const packagePath = getPackageJsonPath(cwd);
  const pkg = await fs.readFile(packagePath, "utf8").catch((error) => {
    throw new Error(
      `Failed to read "${packagePath}": ${error instanceof Error ? error.message : String(error)}`
    );
  });
  try {
    return JSON.parse(pkg);
  } catch (error) {
    throw new Error(
      `Failed to parse "${packagePath}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const COMMIT_GUIDELINE = "See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.";
const CHANGELOG_HEADER = [
  "# Changelog",
  "",
  "All notable changes to this project will be documented in this file.",
  COMMIT_GUIDELINE,
  ""
].join("\n");
const updateChangelogFile = async (versionChangelogContent, tagPrefix, file = "CHANGELOG.md") => {
  const START_OF_LAST_RELEASE_PATTERN = new RegExp(
    `(^#+ \\[?(?:${tagPrefix})?\\d+\\.\\d+\\.\\d+|<a name=)`,
    "m"
  );
  let oldContent = "";
  try {
    oldContent = await fs.readFile(file, "utf8");
    const oldContentStart = oldContent.search(START_OF_LAST_RELEASE_PATTERN);
    if (oldContentStart !== -1) {
      oldContent = oldContent.slice(Math.max(0, oldContentStart));
    }
  } catch {
  }
  await fs.writeFile(
    file,
    `${CHANGELOG_HEADER}
${versionChangelogContent}
${oldContent}`
  );
};

const todayInYYYYMMDD = () => {
  const dateFormatter = Intl.DateTimeFormat("sv-SE", {
    timeZone: "UTC"
  });
  return dateFormatter.format(/* @__PURE__ */ new Date());
};
const versionCommandAction = async (options, { logger = new LoggerCLI("@pob/version", { json: options.json }) } = {}) => {
  const rootWorkspace = await (options.cwdIsRoot ? createWorkspace(options.cwd) : findRootWorkspace(options.cwd));
  if (!rootWorkspace) {
    throw new UsageError("Could not find root workspace from this path.");
  }
  const packageManager = options.packageManager ? getPackageManager(rootWorkspace, options.packageManager) : autoDetectPackageManager(rootWorkspace);
  const project = await createProjectWorkspace(rootWorkspace);
  if (!options.dryRun) {
    const dirtyFiles = await getDirtyFiles(project.root);
    if (dirtyFiles) {
      throw new Error(
        `Dirty Files:
${dirtyFiles}

There are uncommitted changes in the git repository. Please commit or stash them first.`
      );
    }
  }
  const rootWorkspaceChildren = [...project.children.values()];
  let rootNewVersion = "";
  let rootNewTag = "";
  const isMonorepo = rootWorkspaceChildren.length > 0;
  const isMonorepoVersionIndependent = isMonorepo && !rootWorkspace.pkg.version;
  const workspaces = !(isMonorepo && !rootWorkspaceChildren) || options.includesRoot ? [rootWorkspace, ...rootWorkspaceChildren] : rootWorkspaceChildren;
  if (options.prerelease) {
    throw new UsageError("--prerelease is not supported yet.");
  }
  if (options.ignoreChanges) {
    throw new UsageError("--ignore-changes is not supported yet.");
  }
  const [conventionalCommitConfig, parsedRepoUrl, gitCurrentBranch] = await Promise.all([
    loadConventionalCommitConfig(rootWorkspace, options.preset),
    options.createRelease ? parseGithubRepoUrl(rootWorkspace) : void 0,
    getGitCurrentBranch(rootWorkspace),
    // ensure gh CLI is available early to fail fast if necessary
    options.createRelease ? ensureGhCliAvailable(rootWorkspace) : void 0
  ]);
  const rootPreviousVersionTagPromise = options.force || isMonorepoVersionIndependent ? null : getGitLatestTagVersion(rootWorkspace, {
    prefix: options.tagVersionPrefix,
    skipUnstable: true
  });
  const buildTagName = (workspace, version) => `${isMonorepo && workspace !== rootWorkspace ? `${getWorkspaceName(workspace)}@` : options.tagVersionPrefix}${version}`;
  const changedWorkspaces = /* @__PURE__ */ new Map();
  const dependenciesMap = isMonorepo ? buildDependenciesMaps(project) : null;
  const bumpableWorkspaces = [];
  logger.group(
    options.force ? "Check all workspaces (force option)" : "Finding changed workspaces",
    () => {
      for (const workspace of workspaces) {
        const workspaceName = getWorkspaceName(workspace);
        const isRoot = workspace === rootWorkspace;
        if (isRoot && isMonorepo && isMonorepoVersionIndependent) continue;
        const version = workspace.pkg.version;
        if (!version || version === "0.0.0") {
          if ((isRoot || isMonorepoVersionIndependent) && (!isMonorepo || !isMonorepoVersionIndependent)) {
            throw new UsageError(
              'package.json has no version in its manifest. For the first release, set to "1.0.0-pre" or "0.1.0-pre".'
            );
          }
          logger.info(`${workspaceName}: skipped (no version)`);
          continue;
        }
        bumpableWorkspaces.push({
          workspace,
          workspaceName,
          isRoot,
          version
        });
      }
      if (bumpableWorkspaces.length > 0) {
        logger.info("Found bumpable workspaces", {
          count: bumpableWorkspaces.length
        });
      }
    }
  );
  const previousTagVersionByWorkspace = new Map(
    await Promise.all(
      bumpableWorkspaces.map(async ({ workspace, workspaceName, isRoot }) => {
        const packageOption = isMonorepo && isMonorepoVersionIndependent ? workspaceName : void 0;
        const tagPrefix = packageOption ? `${packageOption}@` : options.tagVersionPrefix;
        const previousTagAndVersion = await (isRoot || !isMonorepoVersionIndependent ? rootPreviousVersionTagPromise : getGitLatestTagVersion(rootWorkspace, {
          path: workspace.relativeCwd,
          prefix: tagPrefix,
          skipUnstable: true
        }));
        return [workspace, previousTagAndVersion];
      })
    )
  );
  if (options.dryRun) {
    logger.info("Previous tags", {
      previousTagByWorkspace: Object.fromEntries(
        [...previousTagVersionByWorkspace.entries()].map(
          ([workspace, previousTagVersion]) => [
            getWorkspaceName(workspace),
            previousTagVersion?.tag
          ]
        )
      )
    });
  }
  const parseCommits = createCommitsParser(conventionalCommitConfig);
  const commitsByWorkspace = options.force ? void 0 : new Map(
    await Promise.all(
      bumpableWorkspaces.map(async ({ workspace }) => {
        const previousTagVersion = previousTagVersionByWorkspace.get(workspace);
        const commits = await asyncIterableToArray(
          parseCommits(
            getGitCommits(rootWorkspace, {
              path: workspace.relativeCwd,
              from: previousTagVersion?.tag || void 0
            })
          )
        );
        return [workspace, commits];
      })
    )
  );
  await logger.group("Finding changed workspaces", async () => {
    for (const { workspace, workspaceName } of bumpableWorkspaces) {
      let bumpType = null;
      let bumpReason;
      if (options.force) {
        bumpType = options.force;
        bumpReason = "forced by --force flag";
      } else {
        const commits = commitsByWorkspace?.get(workspace);
        if (!commits || commits.length === 0) {
          logger.info(`${workspaceName}: skipped (no changes)`);
          continue;
        }
        const { releaseType, reason } = await recommendBump(
          commits,
          conventionalCommitConfig
        );
        bumpReason = reason;
        if (releaseType) {
          bumpType = releaseType;
        }
      }
      if (bumpType) {
        if (isMonorepo && !workspace.pkg.name) {
          throw new Error("Workspace name is required");
        }
        const currentVersion = workspace.pkg.version;
        if (!currentVersion) {
          throw new UsageError(
            `Invalid "${getWorkspaceName(workspace)}" version`
          );
        }
        changedWorkspaces.set(workspace, {
          bumpType,
          bumpReason
        });
      }
    }
    if (changedWorkspaces.size === 0) {
      logger.info("No changed workspaces");
    }
  });
  const bumpedWorkspaces = /* @__PURE__ */ new Map();
  const noVersionToUpdateWorkspaces = /* @__PURE__ */ new Map();
  const batches = dependenciesMap ? buildTopologicalOrderBatches(project, dependenciesMap) : [[rootWorkspace]];
  logger.group("Preparing bumping", () => {
    for (const batch of batches) {
      for (const workspace of batch) {
        const currentVersion = workspace.pkg.version;
        if (!currentVersion && !workspace.pkg.private) {
          throw new UsageError(
            `Invalid "${getWorkspaceName(workspace)}" version`
          );
        }
        const changedWorkspace = changedWorkspaces.get(workspace);
        let bumpType = null;
        const bumpReasons = [];
        const dependenciesToBump = [];
        if (changedWorkspace) {
          bumpType = changedWorkspace.bumpType;
          bumpReasons.push(changedWorkspace.bumpReason || "by commits");
        }
        const dependencies = dependenciesMap?.get(workspace);
        if (dependencies) {
          for (const [
            dependencyWorkspace,
            dependencyType,
            dependencyDescriptor
          ] of dependencies) {
            const dependencyBumpedWorkspace = bumpedWorkspaces.get(dependencyWorkspace);
            if (!dependencyBumpedWorkspace) {
              continue;
            }
            if (dependencyType === "peerDependencies" && !options.alwaysBumpPeerDependencies && // skip when peerdependency with a new version satisfied by the existing range.
            satisfies(
              dependencyBumpedWorkspace.newVersion,
              dependencyDescriptor.selector,
              { includePrerelease: true }
            )) {
              continue;
            }
            const newRange = calcBumpRange(
              workspace,
              dependencyDescriptor.selector,
              dependencyBumpedWorkspace.newVersion
            );
            if (dependencyDescriptor.selector === newRange && newRange !== "workspace:*") {
              continue;
            }
            dependenciesToBump.push([
              dependencyType,
              dependencyDescriptor,
              newRange
            ]);
            bumpType = getHighestBumpType([
              bumpType ?? "patch",
              calcBumpType(
                dependencyBumpedWorkspace.bumpType,
                options.bumpDependentsHighestAs
              )
            ]);
            bumpReasons.push(
              `Version bump for dependency: ${PackageDescriptorNameUtils.stringify(dependencyDescriptor.name)}`
            );
          }
        }
        const workspaceName = getWorkspaceName(workspace);
        if (!currentVersion) {
          logger.info(`${workspaceName}: skipped (no version)`);
          if (workspace !== rootWorkspace) {
            noVersionToUpdateWorkspaces.set(workspace, {
              dependenciesToBump
            });
          }
        } else if (!bumpType) {
          logger.info(
            `${workspaceName}: skipped (${changedWorkspace ? `no bump recommended by ${options.preset}` : "no changes"})`
          );
        } else {
          const newVersion = incrementVersion(
            workspace,
            currentVersion,
            bumpType
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
              bumpForDependenciesReasons: changedWorkspace ? bumpReasons.slice(1) : bumpReasons,
              newVersion,
              newTag: tagName,
              hasChanged: changedWorkspace !== void 0,
              dependenciesToBump
            });
            logger.info(
              `${workspaceName}: ${currentVersion} -> ${!isMonorepo || isMonorepoVersionIndependent ? newVersion : "bump"} (${bumpReason.replaceAll("\n", " ; ")})`
            );
          }
        }
      }
    }
  });
  if (isMonorepo && !isMonorepoVersionIndependent) {
    const currentVersion = rootWorkspace.pkg.version;
    const highestBumpType = getHighestBumpType(
      [...bumpedWorkspaces.values()].map(({ bumpType }) => bumpType)
    );
    const newVersion = incrementVersion(
      rootWorkspace,
      currentVersion,
      highestBumpType
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
      ...noVersionToUpdateWorkspaces.entries()
    ].forEach(([workspace, { dependenciesToBump }]) => {
      dependenciesToBump.forEach((dependencyToBump) => {
        dependencyToBump[2] = calcBumpRange(
          workspace,
          dependencyToBump[1].selector,
          newVersion
        );
      });
    });
    bumpedWorkspaces.set(rootWorkspace, {
      currentVersion,
      bumpType: highestBumpType,
      hasChanged: true,
      newVersion: rootNewVersion,
      newTag: rootNewTag,
      dependenciesToBump: []
    });
    logger.info(
      `${currentVersion} -> ${newVersion}`
      // TODO Json only:
      // {
      //   oldVersion: currentVersion,
      //   newVersion, },
    );
  }
  await logger.group("Applying changes", async () => {
    if (!options.dryRun) {
      if (packageManager.installOnPackageContentChange) {
        logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
        await packageManager.installOnPackageContentChange(rootWorkspace);
      }
      logger.info("Lifecycle script: preversion");
      if (isMonorepoVersionIndependent && rootWorkspace.pkg.scripts?.preversion) {
        await packageManager.runScript(rootWorkspace, "preversion");
      }
      for (const workspace of bumpedWorkspaces.keys()) {
        if (workspace.pkg.scripts?.preversion) {
          await packageManager.runScript(workspace, "preversion");
        }
      }
      logger.info("Modifying versions in package.json");
      await Promise.all(
        [...bumpedWorkspaces.entries()].map(
          ([workspace, { newVersion, dependenciesToBump }]) => {
            workspace.pkg.version = newVersion;
            for (const [
              dependencyType,
              dependencyDescriptor,
              dependencyNewRange
            ] of dependenciesToBump) {
              const newDescriptor = PackageDependencyDescriptorUtils.make(
                dependencyDescriptor,
                dependencyNewRange
              );
              const [key, newValue] = PackageDependencyDescriptorUtils.stringify(newDescriptor);
              workspace.pkg[dependencyType][key] = newValue;
            }
            return writePkg(workspace);
          }
        )
      );
      if (packageManager.installOnPackageContentChange) {
        logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
        await packageManager.installOnPackageContentChange(rootWorkspace);
      }
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
  const changelogs = /* @__PURE__ */ new Map();
  await Promise.all(
    [...bumpedWorkspaces.entries()].map(
      async ([
        workspace,
        { newTag, hasChanged, bumpReason, bumpForDependenciesReasons }
      ]) => {
        const commits = commitsByWorkspace?.get(workspace);
        let changelog = await generateChangelog(
          rootWorkspace,
          workspace.pkg,
          conventionalCommitConfig,
          previousTagVersionByWorkspace.get(workspace)?.tag || null,
          isMonorepoVersionIndependent ? newTag : rootNewTag,
          commits,
          todayInYYYYMMDD()
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
            changelog += `${!changelog.endsWith("\n\n") ? "\n" : ""}${bumpForDependenciesReasons.join("\n")}

`;
          }
        }
        if (changelog.slice(changelog.indexOf("\n")).trim().length === 0) {
          changelog += `${!changelog.endsWith("\n\n") ? "\n" : ""}Note: no notable changes

`;
        }
        if (!changelog && rootWorkspace === workspace) {
          throw new Error("No changelog found for root workspace");
        }
        changelogs.set(workspace, changelog);
        if (options.changelog) {
          if (options.dryRun) {
            logger.info(
              `${getWorkspaceName(workspace)}: ${options.changelog}
${changelog}`
            );
          } else {
            await updateChangelogFile(
              changelog,
              options.tagVersionPrefix,
              `${workspace.cwd}/${options.changelog}`
            );
          }
        }
      }
    )
  );
  if (!options.dryRun) {
    logger.separator();
    if (packageManager.installOnPackageContentChange) {
      logger.info(`${getWorkspaceName(rootWorkspace)}: Running install`);
      await packageManager.installOnPackageContentChange(rootWorkspace);
    }
    logger.separator();
    const changedFiles = await getDirtyFiles(project.root);
    if (changedFiles) {
      logger.info("Commit, tag and push", {
        changedFiles
      });
      const tagsSet = new Set(
        [...bumpedWorkspaces.values()].map(({ newTag }) => newTag).filter((newTag) => newTag !== null)
      );
      const tagsInCommitMessage = [...tagsSet].map((tag) => `- ${tag}`).join("\n");
      const message = options.commitMessage.replace(/\\n/g, "\n").replace(
        /%a/g,
        isMonorepoVersionIndependent ? `

${tagsInCommitMessage}` : rootNewVersion
      ).replace(/%s/g, rootNewTag).replace(/%v/g, rootNewVersion).replace(/%t/g, tagsInCommitMessage);
      await createGitCommit(rootWorkspace, message);
      for (const [workspace, { newTag }] of bumpedWorkspaces.entries()) {
        if (newTag === null) continue;
        await createGitTag(workspace, newTag);
      }
      if (await isBehindRemote(rootWorkspace, options.gitRemote, gitCurrentBranch)) {
        logger.error("Remote is ahead, aborting");
        process.exit(1);
      }
      await pushCommitsAndTags(
        rootWorkspace,
        options.gitRemote,
        gitCurrentBranch
      );
      if (rootWorkspace.pkg.scripts?.postversion) {
        logger.info("Lifecycle script: postversion");
        await packageManager.runScript(rootWorkspace, "postversion");
      }
      if (options.createRelease && parsedRepoUrl) {
        logger.info("Create git release");
        await Promise.all(
          [...bumpedWorkspaces.entries()].map(([workspace, { newTag }]) => {
            if (newTag === null) return void 0;
            const changelog = changelogs.get(workspace);
            if (!changelog) {
              logger.warn(
                `No changelog found for workspace: ${getWorkspaceName(
                  workspace
                )}`
              );
              return void 0;
            }
            return createGhRelease(workspace, {
              parsedRepoUrl,
              tag: newTag,
              body: changelog,
              prerelease: !!options.prerelease
            });
          })
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
                `Skipping private workspace ${getWorkspaceName(workspace)}`
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
const Defaults = {
  cwd: process.cwd(),
  includesRoot: false,
  dryRun: false,
  tagVersionPrefix: "v",
  changelog: "CHANGELOG.md",
  commitMessage: "chore: release %a",
  bumpDependentsHighestAs: "major",
  alwaysBumpPeerDependencies: false,
  gitRemote: "origin",
  verbose: false};
program.command("version", { isDefault: true }).usage("Bump package version using conventional commit").addOption(
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
).addOption(new Option("--json", "Logger json")).addOption(
  new Option(
    "--package-manager <manager>",
    "Specify the package manager to use (bun or yarn). Autodetected if not specified."
  ).choices(["bun", "yarn"])
).addOption(new Option("--publish", "Publish after versioning").default(false)).action((options) => versionCommandAction(options));

const pkg = JSON.parse(
  // eslint-disable-next-line unicorn/prefer-json-parse-buffer
  fs$1.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
program.name(pkg.name).description(pkg.description).version(pkg.version);
program.parse();
//# sourceMappingURL=index-node.mjs.map
