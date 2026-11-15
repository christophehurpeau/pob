import { describe, expect, test } from "vitest";
import type { PackageContext } from "../engine/context.ts";
import type { PipelineResult } from "../engine/pipeline.ts";
import { defineStep } from "../engine/step.ts";
import { createTestContext, runTestSteps } from "../engine/testing.ts";
import { steps } from "../steps/index.ts";
import {
  explainTarget,
  findFileContext,
  parseExplainTarget,
} from "./explain.ts";
import { stepConfigKeys } from "./stepConfigKeys.ts";

const lintStep = defineStep<PackageContext>({
  name: "lint",
  writes: ["pkg.scripts.lint", "files:.oxfmtrc.jsonc"],
  run(ctx) {
    ctx.pkg.set(["scripts", "lint"], "oxlint .");
    ctx.output.owned(".oxfmtrc.jsonc", "{}\n");
  },
});

const createResult = async (): Promise<PipelineResult> => {
  const ctx = createTestContext({
    files: {
      "package.json": JSON.stringify({
        name: "a",
        scripts: { lint: "eslint .", test: "vitest" },
      }),
      "pob.json": JSON.stringify({
        project: { type: "lib", packageManager: "npm", ci: true },
      }),
    },
  });
  const plan = await runTestSteps(ctx, [lintStep]);
  return { plan, effects: [], contexts: [ctx] };
};

describe("explain", () => {
  test("parseExplainTarget", () => {
    expect(parseExplainTarget("./package.json#scripts.lint")).toEqual({
      file: "package.json",
      key: ["scripts", "lint"],
    });
    expect(parseExplainTarget("a/b.json")).toEqual({
      file: "a/b.json",
      key: undefined,
    });
  });

  test("findFileContext: the deepest package", () => {
    const contexts = [
      { location: "packages/a" },
      { location: "." },
      { location: "packages/ab" },
    ] as PackageContext[];
    expect(findFileContext(contexts, "packages/ab/package.json")).toMatchObject(
      {
        ctx: { location: "packages/ab" },
        localPath: "package.json",
      },
    );
    expect(findFileContext(contexts, "package.json")).toMatchObject({
      ctx: { location: "." },
      localPath: "package.json",
    });
  });

  test("a key of package.json", async () => {
    expect(
      explainTarget(
        await createResult(),
        parseExplainTarget("package.json#scripts.lint"),
      ),
    ).toEqual([
      "package.json",
      "  strategy: merged",
      "  owner steps: lint",
      "  pending change: modify",
      '  #scripts.lint: "oxlint ."',
      "  written by:",
      '    lint: scripts.lint = "oxlint ."',
      "  config keys of these steps:",
      `    lint: ${(stepConfigKeys.lint ?? []).join(", ")}`,
    ]);
  });

  test("a key no step writes", async () => {
    expect(
      explainTarget(
        await createResult(),
        parseExplainTarget("package.json#scripts.test"),
      ),
    ).toEqual(
      expect.arrayContaining([
        '  #scripts.test: "vitest"',
        "  no step writes this key: it is kept as it is",
      ]),
    );
  });

  test("an owned file, and a file pob does not manage", async () => {
    const result = await createResult();
    expect(explainTarget(result, parseExplainTarget(".oxfmtrc.jsonc"))).toEqual(
      [
        ".oxfmtrc.jsonc",
        "  strategy: owned",
        "  owner steps: lint",
        "  pending change: create",
        "  config keys of the owner steps:",
        `    lint: ${(stepConfigKeys.lint ?? []).join(", ")}`,
      ],
    );
    expect(explainTarget(result, parseExplainTarget("src/index.ts"))).toEqual([
      "src/index.ts: not managed by pob, edit it freely (the effects may still change it)",
    ]);
  });

  test("every step has its config keys", () => {
    expect(
      steps
        .map((step) => step.name)
        .filter((name) => !(name in stepConfigKeys)),
    ).toEqual([]);
  });
});
