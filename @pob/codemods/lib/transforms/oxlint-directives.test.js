import { describe, expect, it } from "vitest";
import jscodeshift from "jscodeshift";
import { eslintToOxlintRuleNames } from "../utils/oxlintDirectives.cjs";
import transform from "./oxlint-directives.cjs";

/**
 * @param {string} source
 * @param {string} [path]
 */
const run = (source, path = "file.ts") =>
  transform({ path, source }, /** @type {any} */ ({ jscodeshift }), {}) ??
  source;

describe("oxlint-directives", () => {
  it("maps every eslint rule name to a single oxlint rule name", () => {
    expect(eslintToOxlintRuleNames["@typescript-eslint/no-unused-vars"]).toBe(
      "no-unused-vars",
    );
    expect(eslintToOxlintRuleNames["@typescript-eslint/no-explicit-any"]).toBe(
      "typescript/no-explicit-any",
    );
    expect(eslintToOxlintRuleNames.camelcase).toBe("eslint-js/camelcase");
    expect(eslintToOxlintRuleNames["n/no-deprecated-api"]).toBe(
      "node-js/no-deprecated-api",
    );
    expect(eslintToOxlintRuleNames["react-hooks/exhaustive-deps"]).toBe(
      "react/exhaustive-deps",
    );
    expect(eslintToOxlintRuleNames["import-x/no-unresolved"]).toBeUndefined();
  });

  it("renames a moved rule", () => {
    expect(
      run(
        "// eslint-disable-next-line @typescript-eslint/no-explicit-any\nlet a: any;\n",
      ),
    ).toBe(
      "// oxlint-disable-next-line typescript/no-explicit-any\nlet a: any;\n",
    );
  });

  it("keeps the description", () => {
    expect(
      run(
        "/* eslint-disable-next-line no-console -- debug */\nconsole.log();\n",
      ),
    ).toBe(
      "/* oxlint-disable-next-line no-console -- debug */\nconsole.log();\n",
    );
  });

  it("splits rules staying in eslint", () => {
    expect(
      run(
        "// eslint-disable-next-line import-x/no-unresolved, no-console\nimport 'a';\n",
      ),
    ).toBe(
      "/* eslint-disable-next-line import-x/no-unresolved */ // oxlint-disable-next-line no-console\nimport 'a';\n",
    );
    expect(
      run("/* eslint-disable import-x/order, unicorn/no-array-reduce */\n"),
    ).toBe(
      "/* eslint-disable import-x/order */ /* oxlint-disable unicorn/no-array-reduce */\n",
    );
  });

  it("merges rules with the same oxlint name", () => {
    expect(
      run(
        "f(); // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars\n",
      ),
    ).toBe("f(); // oxlint-disable-line no-unused-vars\n");
  });

  it("removes rules of removed plugins", () => {
    expect(run("// eslint-disable-next-line react/display-name\nf();\n")).toBe(
      "f();\n",
    );
    expect(
      run(
        "f(); // eslint-disable-line @typescript-eslint/strict-boolean-expressions\n",
      ),
    ).toBe("f();\n");
    expect(
      run(
        "// eslint-disable-next-line react/display-name, no-console\nconsole.log();\n",
      ),
    ).toBe("// oxlint-disable-next-line no-console\nconsole.log();\n");
  });

  it("keeps other eslint directives", () => {
    const source =
      "/* global foo */\n// eslint-disable-next-line import-x/no-unresolved\nimport 'a';\n";
    expect(run(source)).toBe(source);
  });

  it("adds an oxlint blanket directive", () => {
    expect(run("/* eslint-disable */\n")).toBe(
      "/* eslint-disable */ /* oxlint-disable */\n",
    );
    expect(run("// eslint-disable-next-line -- generated\nf();\n")).toBe(
      "/* eslint-disable-next-line -- generated */ // oxlint-disable-next-line -- generated\nf();\n",
    );
  });

  it("does not change strings", () => {
    const source = 'const a = "// eslint-disable-line no-console";\n';
    expect(run(source)).toBe(source);
  });

  it("handles JSX and eslint-enable", () => {
    expect(
      run(
        "/* eslint-disable no-console */\nconst a = <div>{/* eslint-disable-next-line react/jsx-key */}</div>;\n/* eslint-enable no-console */\n",
        "file.tsx",
      ),
    ).toBe(
      "/* oxlint-disable no-console */\nconst a = <div>{/* oxlint-disable-next-line react/jsx-key */}</div>;\n/* oxlint-enable no-console */\n",
    );
  });

  it("parses TS type assertions in .ts files", () => {
    expect(
      run("// eslint-disable-next-line no-console\nconsole.log(<string>a);\n"),
    ).toBe("// oxlint-disable-next-line no-console\nconsole.log(<string>a);\n");
  });
});
