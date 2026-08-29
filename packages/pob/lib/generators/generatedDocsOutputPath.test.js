import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const generatorsDir = import.meta.dirname;

/**
 * The "docs" directory is reserved for hand written documentation in generated
 * projects. Generated output (typedoc, coverage lcov, gh-pages publish dir)
 * lives in "generated-docs". This matches a bare "docs" path segment, while
 * allowing "generated-docs", "generate:docs" and urls like
 * "docs.renovatebot.com".
 */
const legacyDocsPath = /(?<![\w.:-])docs(?![\w.-])/;

describe("generated documentation output path", () => {
  it("never targets the reserved directory", async () => {
    const entries = await fs.readdir(generatorsDir, {
      recursive: true,
      withFileTypes: true,
    });

    const offenders = [];
    for (const entry of entries) {
      if (!entry.isFile() || entry.name.endsWith(".test.js")) continue;
      const filePath = path.join(entry.parentPath, entry.name);
      const content = await fs.readFile(filePath, "utf8");
      content.split("\n").forEach((line, index) => {
        if (legacyDocsPath.test(line)) {
          offenders.push(
            `${path.relative(generatorsDir, filePath)}:${index + 1}: ${line.trim()}`,
          );
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
