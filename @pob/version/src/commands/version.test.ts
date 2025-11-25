import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Level, LoggerCLI, StringHandler } from "nightingale";
import type { VersionCommandOptions } from "./version.ts";
import { Defaults, versionCommandAction } from "./version.ts";

interface ExecuteCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
const presetOption = {
  // preset: fileURLToPath(
  //   new URL(
  //     "../../node_modules/conventional-changelog-conventionalcommits",
  //     import.meta.url,
  //   ),
  // ),
};

class TesteableLoggerCLI extends LoggerCLI {
  stringHandler = new StringHandler(Level.ALL);

  protected override getHandlersAndProcessors(recordLevel: number) {
    return {
      handlers: [this.stringHandler],
      processors: [],
    };
  }
}

const executeAction = async (
  options: Partial<VersionCommandOptions>,
): Promise<ExecuteCommandResult> => {
  const logger = new TesteableLoggerCLI("yarn-version", {});
  const nightingaleHandler = logger.stringHandler;
  try {
    await versionCommandAction(
      { ...Defaults, ...options, cwdIsRoot: true },
      { logger },
    );
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: (error as any).toString(),
    };
  }
  return {
    exitCode: 0,
    stdout: nightingaleHandler.string,
    stderr: "",
  };
};

describe("version", () => {
  it.each(["yarn", "bun"] as const)(
    "should fail for %s if package has no version",
    async (packageManager) => {
      const { exitCode, stdout, stderr } = await executeAction({
        ...presetOption,
        dryRun: true,
        packageManager,
        cwd: fileURLToPath(
          new URL(
            `../__fixtures__/${packageManager}-no-version`,
            import.meta.url,
          ),
        ),
      });
      expect(exitCode).toBe(1);
      expect(stderr).toContain(
        'UsageError: package.json has no version in its manifest. For the first release, set to "1.0.0-pre" or "0.1.0-pre".',
      ); // replace with expected output
      expect(stdout).toBeFalsy();
    },
  );

  it.each(["yarn", "bun"] as const)(
    "should fail for %s if --prerelease is passed",
    async (packageManager) => {
      const { exitCode, stdout, stderr } = await executeAction({
        ...presetOption,
        prerelease: "alpha",
        dryRun: true,
        packageManager,
        cwd: fileURLToPath(
          new URL(`../__fixtures__/${packageManager}-basic`, import.meta.url),
        ),
      });
      expect(exitCode).toBe(1);
      expect(stderr).toContain("prerelease is not supported yet."); // replace with expected output
      expect(stdout).toBeFalsy();
    },
  );

  it.each(["yarn", "bun"] as const)(
    "should pass for %s with dry-run and force",
    async (packageManager) => {
      const { exitCode, stdout, stderr } = await executeAction({
        ...presetOption,
        force: "minor",
        dryRun: true,
        packageManager,
        cwd: fileURLToPath(
          new URL(`../__fixtures__/${packageManager}-basic`, import.meta.url),
        ),
      });
      expect(stderr).toBeFalsy();
      expect(exitCode).toBe(0);
      expect(stdout).toContain("basic: 1.0.0 -> 1.1.0"); // replace with expected output
    },
  );
});
