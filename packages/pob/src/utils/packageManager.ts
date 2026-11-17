import type { PackageManager } from "../engine/config.ts";

export const quoteArg = (value: string): string =>
  `'${value.replaceAll("'", "'\"'")}'`;

const unsupported = (packageManager: never): never => {
  throw new Error(`Unsupported package manager: ${String(packageManager)}`);
};

export const packageManagerRun = (
  packageManager: PackageManager | undefined,
  script: string,
  packagePath?: string | true,
): string => {
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
      return unsupported(packageManager);
  }
};

export const packageManagerExec = (
  packageManager: PackageManager | undefined,
  command: string,
): string => {
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
      return unsupported(packageManager);
  }
};

/** `pnpm run` and `npm run` only resolve package.json scripts, not binaries */
export const packageManagerExecWithCwd = (
  packageManager: PackageManager | undefined,
  cwd: string,
  command: string,
): string => {
  switch (packageManager) {
    case undefined:
    case "yarn":
      return `yarn ${quoteArg(cwd)} run ${command}`;
    case "npm":
      return `cd ${quoteArg(cwd)} && npx ${command}`;
    case "bun":
      return `bun run --cwd ${quoteArg(cwd)} ${command}`;
    case "pnpm":
      return `pnpm --dir ${quoteArg(cwd)} exec ${command}`;
    default:
      return unsupported(packageManager);
  }
};

export const packageManagerRunWithCwd = (
  packageManager: PackageManager | undefined,
  cwd: string,
  script: string,
): string => {
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
      return unsupported(packageManager);
  }
};
