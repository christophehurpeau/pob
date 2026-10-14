import { describe, expect, it } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "./oxlint-eslint-config.cjs";

/**
 * @param {string} source
 */
const run = (source) => {
  /** @type {string[]} */
  const reports = [];
  const output = transform(
    { path: "eslint.config.js", source },
    /** @type {any} */ ({
      jscodeshift,
      report: (message) => reports.push(message),
    }),
    {},
  );
  return { output: output ?? source, reports };
};

describe("oxlint-eslint-config", () => {
  it("removes configs left empty and renames deprecated ones", () => {
    const { output, reports } =
      run(`import pobConfig, { apply } from "@pob/eslint-config";

const { configs } = pobConfig;

export default [
  ...pobConfig.configs.nodeModule,
  ...pobConfig.configs.app,
  ...apply({
    files: ["packages/a/"],
    mode: "directory",
    configs: [...configs.allowUnsafe, ...configs.app],
  }),
  ...apply({
    files: ["packages/b/"],
    mode: "directory",
    configs: [...configs.allowUnsafe, { rules: { "import-x/order": "off" } }],
  }),
  ...applyTs({ configs: configs.allowImplicitReturnType }),
];
`);
    expect(output).toBe(`import pobConfig, { apply } from "@pob/eslint-config";

const { configs } = pobConfig;

export default [...pobConfig.configs.node, ...apply({
  files: ["packages/b/"],
  mode: "directory",
  configs: [{ rules: { "import-x/order": "off" } }],
})];
`);
    expect(reports).toEqual([]);
  });

  it("removes rule entries of rules moved to oxlint", () => {
    const { output, reports } = run(`export default [
  {
    rules: {
      complexity: "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "import-x/no-unresolved": "off",
    },
  },
];
`);
    expect(output).toBe(`export default [
  {
    rules: {
      "import-x/no-unresolved": "off",
    },
  },
];
`);
    expect(reports).toEqual([
      'eslint.config.js:4: "complexity" is checked by oxlint: configure "complexity" in .oxlintrc.json instead.',
      'eslint.config.js:5: "@typescript-eslint/no-explicit-any" is checked by oxlint: configure "typescript/no-explicit-any" in .oxlintrc.json instead.',
      'eslint.config.js:6: "react/display-name" was removed.',
    ]);
  });

  it("reports usages it cannot update", () => {
    const { reports } = run("const app = pobConfig.configs.app;\n");
    expect(reports).toEqual([
      'eslint.config.js:1: "configs.app" was removed, update this usage by hand.',
    ]);
  });
});

describe("oxlint-eslint-config cleanup", () => {
  it("removes configs left without rules", () => {
    const { output } = run(`export default [
  ...apply({
    files: ["packages/pob/"],
    mode: "directory",
    configs: [{ rules: { complexity: "off" } }],
  }),
  { files: ["a.js"], rules: { "no-console": "off" } },
  { files: ["b.js"], rules: { "import-x/order": "off", "no-console": "off" } },
];
`);
    // recast keeps the original formatting of the remaining nodes
    expect(output.replaceAll(/\s+/g, "")).toBe(
      'export default [{ files: ["b.js"], rules: { "import-x/order": "off", } }];'.replaceAll(
        /\s+/g,
        "",
      ),
    );
  });
});
