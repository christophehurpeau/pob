/**
 * Run a script in all workspaces in parallel.
 * Use for independent operations like lint, test, clean.
 */
export const workspacesRun = (packageManager, script) => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn workspaces foreach --parallel -Av run ${script}`;
    case "pnpm":
      return `pnpm -r --parallel run ${script}`;
    case "npm":
      return `npm run ${script} --workspaces`;
    case "bun":
      return `bun --filter '*' run ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

/**
 * Run a script in all workspaces in topological dependency order.
 * Use for build where packages may depend on each other.
 */
export const workspacesRunTopological = (packageManager, script) => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn workspaces foreach --parallel --topological-dev -Av run ${script}`;
    case "pnpm":
      return `pnpm -r run ${script}`; // pnpm respects topological order by default (without --parallel)
    case "npm":
      return `npm run ${script} --workspaces`;
    case "bun":
      return `bun --filter '*' run ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

/**
 * Run a script sequentially in every workspace that defines it.
 * Use when parallel execution is unsafe (e.g. package manager upgrades).
 */
export const workspacesRunSequential = (packageManager, script) => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn workspaces foreach -Av run ${script}`;
    case "pnpm":
      return `pnpm -r --sequential run ${script}`;
    case "npm":
      return `npm run ${script} --workspaces --if-present`;
    case "bun":
      return `bun --filter '*' run ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

/**
 * Run a script in the given workspaces only, in topological dependency order.
 * Use to build packages other builds depend on first.
 */
export const workspacesRunOnly = (packageManager, script, ...packageNames) => {
  switch (packageManager) {
    case undefined:
    case "yarn": {
      const includeArgs = packageNames
        .map((name) => `--include "${name}"`)
        .join(" ");
      return `yarn workspaces foreach --topological-dev ${includeArgs} -Av run ${script}`;
    }
    case "pnpm": {
      const filterArgs = packageNames
        .map((name) => `--filter "${name}"`)
        .join(" ");
      return `pnpm ${filterArgs} run ${script}`;
    }
    case "npm": {
      const workspaceArgs = packageNames
        .map((name) => `--workspace "${name}"`)
        .join(" ");
      return `npm run ${script} ${workspaceArgs}`;
    }
    case "bun": {
      const filterArgs = packageNames
        .map((name) => `--filter '${name}'`)
        .join(" ");
      return `bun ${filterArgs} run ${script}`;
    }
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

/**
 * Run a script in all workspaces in parallel, excluding packages matching the given patterns.
 * Use for watch commands where example/demo packages should be skipped.
 */
export const workspacesRunExcluding = (
  packageManager,
  script,
  ...excludePatterns
) => {
  switch (packageManager) {
    case undefined:
    case "yarn": {
      const excludeArgs = excludePatterns
        .map((p) => `--exclude "${p}"`)
        .join(" ");
      return `yarn workspaces foreach --parallel --jobs unlimited --interlaced ${excludeArgs} -Av run ${script}`;
    }
    case "pnpm": {
      const filterArgs = excludePatterns
        .map((p) => `--filter "!${p}"`)
        .join(" ");
      return `pnpm -r --parallel ${filterArgs} run ${script}`;
    }
    case "npm":
      return `npm run ${script} --workspaces`;
    case "bun": {
      const filterArgs = excludePatterns
        .map((p) => `--filter '!${p}'`)
        .join(" ");
      return `bun ${filterArgs} run ${script}`;
    }
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};
