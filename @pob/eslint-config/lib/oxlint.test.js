import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lintWithOxlint, oxlintConfigsDir } from "./test-utils/oxlint.js";

const baseConfigPath = path.join(oxlintConfigsDir, "base.json");
const moduleConfigPath = path.join(oxlintConfigsDir, "module.json");
const nodeConfigPath = path.join(oxlintConfigsDir, "node.json");
const typescriptConfigPath = path.join(oxlintConfigsDir, "typescript.json");
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
const lint = async (cwd, source, fileName = "file.js") => {
  await writeFile(path.join(cwd, fileName), source);
  return lintWithOxlint(cwd);
};

const summarize = (diagnostics) =>
  diagnostics.map(({ code, message, labels }) => ({
    line: labels[0].span.line,
    rule: code ?? message,
  }));

/**
 * @param {Record<string, unknown>} config
 * @param {string[]} extendsPaths
 */
const useProject = (config, extendsPaths = [baseConfigPath]) => {
  const project = { cwd: "" };

  beforeAll(async () => {
    project.cwd = await mkdtemp(path.join(tmpdir(), "pob-oxlint-"));
    await writeFile(
      path.join(project.cwd, ".oxlintrc.json"),
      JSON.stringify({ ...config, extends: extendsPaths }),
    );
    await writeFile(
      path.join(project.cwd, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true } }),
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

describe("oxlint/module.json", () => {
  const project = useProject({}, [baseConfigPath, moduleConfigPath]);
  const commonjs = "exports.a = 1;\n";

  it("reports CommonJS in ES modules", async () => {
    expect(summarize(await lint(project.cwd, commonjs, "file.js"))).toEqual([
      { line: 1, rule: "import(no-commonjs)" },
    ]);
  });

  // like the eslint configs, which apply commonjs rules to .cjs files
  it("allows CommonJS in .cjs files", async () => {
    await rm(path.join(project.cwd, "file.js"));
    expect(await lint(project.cwd, commonjs, "file.cjs")).toEqual([]);
  });
});

describe("oxlint/node.json", () => {
  const project = useProject({}, [baseConfigPath, nodeConfigPath]);
  const commonjs = '"use strict";\n';

  it("reports CommonJS in ES modules", async () => {
    expect(summarize(await lint(project.cwd, commonjs, "file.js"))).toEqual([
      { line: 1, rule: "unicorn(prefer-module)" },
    ]);
  });

  // like the eslint node configs, which apply nodeCommonjs rules to .cjs files
  it("allows CommonJS in .cjs files", async () => {
    await rm(path.join(project.cwd, "file.js"));
    expect(await lint(project.cwd, commonjs, "file.cjs")).toEqual([]);
  });

  // plugins are merged through extends: node.json does not replace the import
  // plugin of base.json
  it("keeps the plugins of base.json", async () => {
    expect(
      summarize(
        await lint(
          project.cwd,
          '"use strict";\n\nexports = require(process.env.NAME);\n',
          "file.cjs",
        ),
      ),
    ).toEqual([
      { line: 3, rule: "node(no-exports-assign)" },
      { line: 3, rule: "import(no-dynamic-require)" },
    ]);
  });
});

describe("oxlint/typescript.json", () => {
  const project = useProject({}, [baseConfigPath, typescriptConfigPath]);
  const floatingPromise = "Promise.resolve();\nexport {};\n";

  // documented as root-only, but inherited through extends
  it("enables type-aware linting", async () => {
    expect(
      summarize(await lint(project.cwd, floatingPromise, "file.ts")),
    ).toEqual([{ line: 1, rule: "typescript(no-floating-promises)" }]);
  });

  // oxlint applies type-aware rules to the .js files of a TypeScript project
  it("scopes rules to TypeScript files", async () => {
    await rm(path.join(project.cwd, "file.ts"));
    expect(await lint(project.cwd, floatingPromise, "file.js")).toEqual([]);
  });
});

// projects extend them after typescript.json, like the matching eslint configs
describe.each([
  {
    fileName: "",
    expected: [
      "error typescript(explicit-function-return-type)",
      "error typescript(explicit-module-boundary-types)",
      "error typescript(no-unsafe-member-access)",
      "error typescript(no-unsafe-return)",
    ],
  },
  {
    fileName: "app.json",
    expected: [
      "error typescript(no-unsafe-member-access)",
      "error typescript(no-unsafe-return)",
    ],
  },
  {
    fileName: "allow-implicit-return-type.json",
    expected: [
      "error typescript(no-unsafe-member-access)",
      "error typescript(no-unsafe-return)",
    ],
  },
  {
    fileName: "allow-unsafe.json",
    expected: [
      "error typescript(explicit-function-return-type)",
      "error typescript(explicit-module-boundary-types)",
    ],
  },
  {
    fileName: "allow-unsafe-as-warn.json",
    expected: [
      "error typescript(explicit-function-return-type)",
      "error typescript(explicit-module-boundary-types)",
      "warning typescript(no-unsafe-member-access)",
      "warning typescript(no-unsafe-return)",
    ],
  },
])("oxlint/typescript.json with $fileName", ({ fileName, expected }) => {
  const project = useProject({}, [
    baseConfigPath,
    typescriptConfigPath,
    ...(fileName ? [path.join(oxlintConfigsDir, fileName)] : []),
  ]);

  it("overrides the rules", async () => {
    const diagnostics = await lint(
      project.cwd,
      "export function f(value: any) {\n  return value.a;\n}\n",
      "file.ts",
    );
    expect(
      [
        ...new Set(
          diagnostics
            .filter(({ code }) => /\((?:explicit-|no-unsafe-)/.test(code ?? ""))
            .map(({ code, severity }) => `${severity} ${code}`),
        ),
      ].toSorted(),
    ).toEqual(expected);
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
