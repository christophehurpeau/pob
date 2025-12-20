import { quoteArg } from "./execUtils.js";

export const packageManagerRun = (packageManager, script) => {
  switch (packageManager) {
    case "yarn":
      return `yarn run ${script}`;
    case "npm":
      return `npm run ${script}`;
    case "bun":
      return `bun run ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

export const packageManagerRunWithCwd = (packageManager, cwd, script) => {
  switch (packageManager) {
    case "yarn":
      return `yarn ${quoteArg(cwd)} run ${script}`;
    case "npm":
      return `npm --prefix ${quoteArg(cwd)} run ${script}`;
    case "bun":
      return `bun run --cwd ${quoteArg(cwd)} ${script}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};
