import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lintWithOxlint, oxlintConfigsDir } from "./test-utils/oxlint.js";

const baseConfigPath = path.join(oxlintConfigsDir, "base.json");
// this repo's config, the options are not in base.json so projects keep
// eslint-disable comments working
const rootConfig = JSON.parse(
  await readFile(
    path.resolve(import.meta.dirname, "../../../.oxlintrc.json"),
    "utf8",
  ),
);

/**
 * Lints `source` in a project whose .oxlintrc.json extends base.json, like the
 * one written by pob.
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

/**
 * @param {Record<string, unknown>} config
 */
const useProject = (config) => {
  const project = { cwd: "" };

  beforeAll(async () => {
    project.cwd = await mkdtemp(path.join(tmpdir(), "pob-oxlint-"));
    await writeFile(
      path.join(project.cwd, ".oxlintrc.json"),
      JSON.stringify({ ...config, extends: [baseConfigPath] }),
    );
  });

  afterAll(async () => {
    if (project.cwd) await rm(project.cwd, { recursive: true, force: true });
  });

  return project;
};

describe("oxlint/base.json", () => {
  const project = useProject({});

  it("reports the rule", async () => {
    expect(summarize(await lint(project.cwd, "debugger;\n"))).toEqual([
      { line: 1, rule: "eslint(no-debugger)" },
    ]);
  });

  it("respects oxlint-disable directives", async () => {
    expect(
      await lint(
        project.cwd,
        "// oxlint-disable-next-line no-debugger\ndebugger;\n",
      ),
    ).toEqual([]);
  });

  // projects keep their eslint-disable comments when a rule moves to oxlint
  it("respects eslint-disable directives", async () => {
    expect(
      await lint(
        project.cwd,
        "// eslint-disable-next-line no-debugger\ndebugger;\n",
      ),
    ).toEqual([]);
  });
});

describe("root .oxlintrc.json options", () => {
  const project = useProject({ options: rootConfig.options });

  // with these options, test-lint fixtures prove each oxlint rule fires
  it("ignores eslint-disable directives", async () => {
    expect(
      summarize(
        await lint(
          project.cwd,
          "// eslint-disable-next-line no-debugger\ndebugger;\n",
        ),
      ),
    ).toEqual([{ line: 2, rule: "eslint(no-debugger)" }]);
  });

  it("reports unused oxlint-disable directives", async () => {
    const diagnostics = await lint(
      project.cwd,
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
