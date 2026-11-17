import { describe, expect, test } from "vitest";
import { createTestContext } from "../engine/testing.ts";
import { createConfigReport } from "./showConfig.ts";

describe("createConfigReport", () => {
  test("hides the credentials of the origin url", () => {
    const ctx = createTestContext({
      files: {
        "package.json": "{}",
        "pob.json": JSON.stringify({
          project: { type: "lib", packageManager: "npm", ci: false },
        }),
      },
      facts: {
        originUrl: "https://gitlab-ci-token:secret@gitlab.com/o/r.git",
      },
    });
    const [report] = createConfigReport([ctx]);
    expect(report?.facts.originUrl).toBe("https://***@gitlab.com/o/r.git");
  });
});
