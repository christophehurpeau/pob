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
 * Run a script in all workspaces in parallel, excluding packages matching the given patterns.
 * Use for watch commands where example/demo packages should be skipped.
 */
export const workspacesRunExcluding = (packageManager, script, ...excludePatterns) => {
  switch (packageManager) {
    case undefined:
    case "yarn": {
      const excludeArgs = excludePatterns.map((p) => `--exclude "${p}"`).join(" ");
      return `yarn workspaces foreach --parallel --jobs unlimited --interlaced ${excludeArgs} -Av run ${script}`;
    }
    case "pnpm": {
      const filterArgs = excludePatterns.map((p) => `--filter "!${p}"`).join(" ");
      return `pnpm -r --parallel ${filterArgs} run ${script}`;
    }
    case "npm":
      return `npm run ${script} --workspaces`;
    case "bun": {
      const filterArgs = excludePatterns.map((p) => `--filter '!${p}'`).join(" ");
      return `bun ${filterArgs} run ${script}`;
    }
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};
