import { URL, fileURLToPath } from "node:url";
import { Level } from "nightingale";
import { StringHandler } from "nightingale-string";
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

class NightingaleTestHandler extends StringHandler {
  isHandling = (): true => true;
}

const executeAction = async (
  options: Partial<VersionCommandOptions>,
): Promise<ExecuteCommandResult> => {
  const nightingaleHandler = new NightingaleTestHandler(Level.ALL);

  try {
    await versionCommandAction(
      { ...Defaults, ...options, cwdIsRoot: true },
      {
        nightingaleHandler,
      },
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
  it("should fail if package has no version", async () => {
    const { exitCode, stdout, stderr } = await executeAction({
      ...presetOption,
      dryRun: true,
      cwd: fileURLToPath(
        new URL("../__fixtures__/no-version", import.meta.url),
      ),
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain(
      'UsageError: package.json has no version in its manifest. For the first release, set to "1.0.0-pre" or "0.1.0-pre".',
    ); // replace with expected output
    expect(stdout).toBeFalsy();
  });

  it("should fail if --prerelease is passed", async () => {
    const { exitCode, stdout, stderr } = await executeAction({
      ...presetOption,
      prerelease: "alpha",
      dryRun: true,
      cwd: fileURLToPath(new URL("../__fixtures__/basic", import.meta.url)),
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("prerelease is not supported yet."); // replace with expected output
    expect(stdout).toBeFalsy();
  });

  it("should pass with dry-run and force", async () => {
    const { exitCode, stdout, stderr } = await executeAction({
      ...presetOption,
      force: "minor",
      dryRun: true,
      cwd: fileURLToPath(new URL("../__fixtures__/basic", import.meta.url)),
    });
    expect(stderr).toBeFalsy();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("basic: 1.0.0 -> 1.1.0"); // replace with expected output
  });
});
