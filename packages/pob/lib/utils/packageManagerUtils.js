import { quoteArg } from "./execUtils.js";

export const packageManagerRun = (packageManager, script, packagePath) => {
  const packagePathArg =
    packagePath === "." || packagePath === true ? "" : packagePath;
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn${packagePathArg ? ` ${packagePathArg}` : ""} run ${script}`;
    case "npm":
      return `npm run${packagePathArg ? ` --prefix ${packagePathArg}` : ""} ${script}`;
    case "bun":
      return `bun run${packagePathArg ? ` --cwd ${packagePathArg}` : ""} ${script}`;
    case "pnpm":
      return `pnpm${packagePathArg ? ` --dir ${packagePathArg}` : ""} run ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

export const packageManagerExec = (packageManager, command) => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn ${command}`;
    case "npm":
      return `npx ${command}`;
    case "bun":
      return `bun run ${command}`;
    case "pnpm":
      return `pnpm exec ${command}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

export const packageManagerRunWithCwd = (packageManager, cwd, script) => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn ${quoteArg(cwd)} run ${script}`;
    case "npm":
      return `npm --prefix ${quoteArg(cwd)} run ${script}`;
    case "bun":
      return `bun run --cwd ${quoteArg(cwd)} ${script}`;
    case "pnpm":
      return `pnpm run --dir ${quoteArg(cwd)} ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};
