import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lintWithOxlint, oxlintConfigsDir } from "./test-utils/oxlint.js";

const baseConfigPath = path.join(oxlintConfigsDir, "base.json");

/**
 * Lints `source` in a project whose .oxlintrc.json only extends base.json,
 * like the one written by pob.
 */
const lint = async (cwd, source) => {
  await writeFile(path.join(cwd, "file.js"), source);
  return lintWithOxlint(cwd);
};

const summarize = (diagnostics) =>
  diagnostics.map(({ code, message, labels }) => ({
    line: labels[0].span.line,
    rule: code ?? message,
  }));

describe("oxlint/base.json", () => {
  let cwd;

  beforeAll(async () => {
    cwd = await mkdtemp(path.join(tmpdir(), "pob-oxlint-"));
    await writeFile(
      path.join(cwd, ".oxlintrc.json"),
      JSON.stringify({ extends: [baseConfigPath] }),
    );
  });

  afterAll(async () => {
    if (cwd) await rm(cwd, { recursive: true, force: true });
  });

  it("reports the rule", async () => {
    expect(summarize(await lint(cwd, "debugger;\n"))).toEqual([
      { line: 1, rule: "eslint(no-debugger)" },
    ]);
  });

  it("respects oxlint-disable directives", async () => {
    expect(
      await lint(cwd, "// oxlint-disable-next-line no-debugger\ndebugger;\n"),
    ).toEqual([]);
  });

  it("ignores eslint-disable directives (respectEslintDisableDirectives: false, inherited through extends)", async () => {
    expect(
      summarize(
        await lint(cwd, "// eslint-disable-next-line no-debugger\ndebugger;\n"),
      ),
    ).toEqual([{ line: 2, rule: "eslint(no-debugger)" }]);
  });

  it("reports unused oxlint-disable directives (reportUnusedDisableDirectives, inherited through extends)", async () => {
    const diagnostics = await lint(
      cwd,
      "// oxlint-disable-next-line no-debugger\nexport const a = 1;\n",
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      severity: "error",
      message: expect.stringContaining("Unused oxlint-disable directive"),
      labels: [{ span: { line: 1 } }],
    });
  });
});
