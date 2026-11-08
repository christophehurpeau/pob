import { describe, expect, it } from "vitest";
import { removeUnusedOxlintDirectives } from "./removeUnusedOxlintDirectives.js";

/**
 * Builds the span oxlint reports for `text`, in utf-8 bytes.
 *
 * @param {string} source
 * @param {string} text
 */
const spanOf = (source, text) => {
  const index = source.indexOf(text);
  if (index === -1) throw new Error(`${text} not found`);
  return {
    offset: Buffer.byteLength(source.slice(0, index)),
    length: Buffer.byteLength(text),
  };
};

describe("removeUnusedOxlintDirectives", () => {
  it("removes the line of a directive alone on its line", () => {
    const directive = "// oxlint-disable-next-line no-console -- cli output";
    const source = `const a = 1;\n  ${directive}\nlog(a);\n`;
    expect(
      removeUnusedOxlintDirectives(source, [spanOf(source, directive)]),
    ).toBe("const a = 1;\nlog(a);\n");
  });

  it("removes a trailing directive and the spaces before it", () => {
    const directive = "// oxlint-disable-next-line eqeqeq";
    const source = `const same = a === b && ${directive}\n  c == d;\n`;
    expect(
      removeUnusedOxlintDirectives(source, [spanOf(source, directive)]),
    ).toBe("const same = a === b &&\n  c == d;\n");
  });

  it("removes one rule of several, keeping the description", () => {
    const source =
      "// oxlint-disable-next-line regexp/no-unused-capturing-group, regexp/no-super-linear-backtracking -- legacy\nconst re = /(a+)+b/;\n";
    expect(
      removeUnusedOxlintDirectives(source, [
        spanOf(source, "regexp/no-unused-capturing-group"),
      ]),
    ).toBe(
      "// oxlint-disable-next-line regexp/no-super-linear-backtracking -- legacy\nconst re = /(a+)+b/;\n",
    );
  });

  it("removes several rules of a block directive, keeping its end", () => {
    const source =
      "/* oxlint-disable eslint/no-bitwise, typescript/require-await, import/no-duplicates */\nimport { a } from 'a';\n";
    expect(
      removeUnusedOxlintDirectives(source, [
        spanOf(source, "eslint/no-bitwise"),
        spanOf(source, "import/no-duplicates"),
      ]),
    ).toBe(
      "/* oxlint-disable typescript/require-await */\nimport { a } from 'a';\n",
    );
  });

  it("removes a block directive when all its rules are unused", () => {
    const source =
      "/* oxlint-disable eslint/no-bitwise, import/no-duplicates */\nimport { a } from 'a';\n";
    expect(
      removeUnusedOxlintDirectives(source, [
        spanOf(source, "eslint/no-bitwise"),
        spanOf(source, "import/no-duplicates"),
      ]),
    ).toBe("import { a } from 'a';\n");
  });

  it("converts the utf-8 byte offsets of oxlint", () => {
    const directive = "// oxlint-disable-next-line no-console";
    const source = `const label = "déjà vu ✨";\n${directive}\nlog(label);\n`;
    expect(
      removeUnusedOxlintDirectives(source, [spanOf(source, directive)]),
    ).toBe('const label = "déjà vu ✨";\nlog(label);\n');
  });

  it("applies the spans of a file from the end", () => {
    const first = "// oxlint-disable-next-line no-console";
    const second = "// oxlint-disable-next-line no-alert";
    const source = `${first}\na();\n${second}\nb();\n`;
    expect(
      removeUnusedOxlintDirectives(source, [
        spanOf(source, first),
        spanOf(source, second),
      ]),
    ).toBe("a();\nb();\n");
  });
});
