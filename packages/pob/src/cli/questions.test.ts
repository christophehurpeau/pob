import { describe, expect, test } from "vitest";
import type { JsonObject } from "../engine/model.ts";
import { parseAnswer } from "./prompt.ts";
import type { Ask, PromptFacts, Question } from "./questions.ts";
import {
  MissingAnswersError,
  createQuestionState,
  finalizeAnswers,
  questions,
  resolveQuestions,
} from "./questions.ts";

const standaloneFacts: PromptFacts = {
  isRoot: true,
  isMonorepoRoot: false,
  inMonorepo: false,
  rootPkg: undefined,
  dirName: "my-lib",
  gitUser: { name: "Git User", email: "git@example.com" },
  hasOriginRemote: true,
  workspacePkgs: [],
  hasCiConfig: false,
};

const packageFacts: PromptFacts = {
  ...standaloneFacts,
  isRoot: false,
  inMonorepo: true,
  rootPkg: {
    author: "Root <root@example.com>",
    type: "module",
    license: "MIT",
  },
};

const monorepoRootFacts: PromptFacts = {
  ...standaloneFacts,
  isMonorepoRoot: true,
  hasCiConfig: true,
};

/** Answers by key, the default otherwise; records the asked keys. */
const createAsk = (
  answers: Record<string, unknown> = {},
): { ask: Ask; asked: string[] } => {
  const asked: string[] = [];
  return {
    asked,
    ask: (question, defaultValue) => {
      asked.push(`${question.file}#${question.key}`);
      const answer = answers[question.key];
      // an array answers the questions sharing a key, in order
      if (Array.isArray(answer)) return Promise.resolve(answer.shift());
      return Promise.resolve(question.key in answers ? answer : defaultValue);
    },
  };
};

const resolveWith = async (
  {
    config = {},
    pkg = {},
    facts,
  }: { config?: JsonObject; pkg?: JsonObject; facts: PromptFacts },
  answers: Record<string, unknown> | undefined,
): Promise<{
  config: JsonObject;
  pkg: JsonObject;
  missing: Question[];
  asked: string[];
}> => {
  const state = createQuestionState(config, pkg, facts);
  const { ask, asked } = createAsk(answers);
  const missing = await resolveQuestions(questions, state, {
    ask: answers ? ask : undefined,
    askOptional: true,
  });
  if (missing.length === 0) finalizeAnswers(state);
  return { config: state.config, pkg: state.pkg, missing, asked };
};

describe("questions", () => {
  test("standalone lib with the defaults", async () => {
    const { config, pkg, asked } = await resolveWith(
      { facts: standaloneFacts },
      { "author.url": "" },
    );
    expect(config).toEqual({
      project: {
        type: "lib",
        packageManager: "yarn",
        yarnNodeLinker: "node-modules",
        ci: true,
      },
      renovate: { enable: true },
      lib: {
        documentation: true,
        testing: false,
        e2e: false,
        buildInGit: false,
      },
      build: {},
    });
    expect(pkg).toEqual({
      name: "my-lib",
      author: "Git User <git@example.com>",
      type: "commonjs",
      license: "MIT",
    });
    expect(asked).toContain("package.json#private");
  });

  test("lib with testing asks the runner and codecov", async () => {
    const { config } = await resolveWith(
      {
        config: { project: { type: "lib", packageManager: "pnpm", ci: true } },
        pkg: { name: "a", author: "A <a@a.a>", type: "module", license: "MIT" },
        facts: standaloneFacts,
      },
      {
        "lib.testing": true,
        "lib.testing.runner": "node",
        "lib.testing.codecov": true,
        "build.bundler": "tsc",
      },
    );
    expect(config.lib).toMatchObject({
      testing: { runner: "node", codecov: true },
    });
    expect(config.build).toEqual({
      bundler: "tsc",
      typescript: true,
      entries: ["index"],
      envs: [{ target: "node", version: "24" }],
    });
  });

  test("only the missing keys are asked", async () => {
    const { asked } = await resolveWith(
      {
        config: {
          project: { type: "lib", packageManager: "npm", ci: false },
          renovate: { enable: false },
          lib: { documentation: false, testing: false, e2e: false },
          build: {},
        },
        pkg: {
          name: "a",
          private: true,
          description: "a",
          author: "A <a@a.a> (https://a.a)",
          type: "module",
          license: "MIT",
        },
        facts: standaloneFacts,
      },
      {},
    );
    expect(asked).toEqual(["pob.json#lib.buildInGit"]);
  });

  test("without a TTY, the missing required keys are listed", async () => {
    const { missing } = await resolveWith(
      {
        config: { project: { type: "lib" } },
        pkg: { name: "a", author: "A <a@a.a>", license: "MIT" },
        facts: standaloneFacts,
      },
      undefined,
    );
    expect(missing.map((question) => question.key)).toEqual([
      "project.packageManager",
      "project.ci",
      "type",
      "renovate.enable",
      "lib.documentation",
      "lib.testing",
      "lib.e2e",
      "build.bundler",
    ]);
    const error = new MissingAnswersError(missing, {
      pobJsonPath: "pob.json",
      pkgPath: "package.json",
    });
    expect(error.message).toContain(
      '  - pob.json#project.packageManager (yarn, npm, bun, pnpm): set "project.packageManager" in pob.json',
    );
    expect(error.message).toContain(
      '  - package.json#type (commonjs, module): set "type" in package.json',
    );
  });

  test("package of a monorepo: no root keys, values of the root", async () => {
    const { config, pkg, asked } = await resolveWith(
      { pkg: { name: "a", version: "1.0.0-pre" }, facts: packageFacts },
      { description: "" },
    );
    expect(asked).not.toContain("pob.json#project.packageManager");
    expect(asked).not.toContain("pob.json#renovate.enable");
    expect(asked).not.toContain("package.json#author.name");
    expect(asked).not.toContain("package.json#lib.testing.runner");
    expect(config).toEqual({
      project: { type: "lib" },
      lib: {
        testing: false,
        e2e: false,
        buildInGit: false,
        documentation: false,
      },
      build: {},
    });
    expect(pkg).toEqual({ name: "a", version: "1.0.0-pre" });
  });

  test("app: next.js asks export, the package is private", async () => {
    const { config, pkg } = await resolveWith(
      {
        config: { project: { type: "app" } },
        pkg: { name: "a" },
        facts: packageFacts,
      },
      { "app.type": "next.js", "app.export": true, "app.testing": true },
    );
    expect(config.app).toEqual({
      type: "next.js",
      export: true,
      testing: true,
      codecov: true,
      e2e: false,
    });
    expect(pkg.private).toBe(true);
  });

  test("node app asks the bundler", async () => {
    const { config } = await resolveWith(
      {
        config: { project: { type: "app" }, app: { type: "node" } },
        pkg: { name: "a" },
        facts: packageFacts,
      },
      { "app.testing": false, "app.e2e": false },
    );
    expect(config.build).toMatchObject({ bundler: "rollup-esbuild" });
  });

  test("add --app: optional keys are not asked", async () => {
    const state = createQuestionState(
      {
        project: { type: "app" },
        app: { type: "vite", testing: true, e2e: false },
      },
      { name: "a", private: true },
      packageFacts,
    );
    const { ask, asked } = createAsk();
    expect(
      await resolveQuestions(questions, state, { ask, askOptional: false }),
    ).toEqual([]);
    expect(asked).toEqual([]);
  });

  test("monorepo root", async () => {
    const { config, pkg } = await resolveWith(
      {
        config: { project: { type: "lib", packageManager: "yarn", ci: true } },
        pkg: {
          name: "repo-monorepo",
          author: "A <a@a.a> (https://a.a)",
          type: "module",
          license: "MIT",
          workspaces: ["packages/*"],
        },
        facts: monorepoRootFacts,
      },
      { "project.yarnNodeLinker": "pnp" },
    );
    expect(config).toEqual({
      project: {
        type: "lib",
        packageManager: "yarn",
        yarnNodeLinker: "pnp",
        ci: true,
      },
      renovate: { enable: true },
      monorepo: {
        ci: true,
        disablePushWorkflow: false,
        testing: true,
        testRunner: "node",
        e2eTesting: true,
        codecov: true,
        documentation: true,
        typescript: true,
        eslint: true,
        storybook: false,
        storybookReactNative: false,
      },
    });
    expect(pkg.private).toBe(true);
  });

  test("repository from the git host without an origin remote", async () => {
    const { pkg } = await resolveWith(
      {
        config: {
          project: { type: "lib", packageManager: "npm", ci: true },
          renovate: { enable: true },
          lib: { documentation: false, testing: false, e2e: false },
          build: {},
        },
        pkg: {
          name: "@scope/my-lib",
          author: "A <a@a.a> (https://a.a)",
          type: "module",
          license: "MIT",
        },
        facts: { ...standaloneFacts, hasOriginRemote: false },
      },
      { repository: ["gitlab", "me"] },
    );
    expect(pkg.repository).toBe("https://gitlab.com/me/my-lib.git");
  });

  test("keeps a repository on an unknown host without asking", async () => {
    const repository = "https://gitlab.mycorp.com/team/my-lib.git";
    const { pkg, asked } = await resolveWith(
      {
        config: {
          project: { type: "lib", packageManager: "npm", ci: true },
          renovate: { enable: true },
          lib: { documentation: false, testing: false, e2e: false },
          build: {},
        },
        pkg: {
          name: "my-lib",
          author: "A <a@a.a> (https://a.a)",
          type: "module",
          license: "MIT",
          repository,
        },
        facts: { ...standaloneFacts, hasOriginRemote: false },
      },
      {},
    );
    expect(asked).not.toContain("package.json#repository");
    expect(pkg.repository).toBe(repository);
  });
});

describe("parseAnswer", () => {
  const [confirmQuestion] = questions.filter(
    (question) => question.kind === "confirm",
  );
  const [selectQuestion] = questions.filter(
    (question) => question.key === "project.packageManager",
  );

  test("confirm", () => {
    if (!confirmQuestion) throw new Error("no confirm question");
    expect(parseAnswer(confirmQuestion, "", true)).toBe(true);
    expect(parseAnswer(confirmQuestion, "n", true)).toBe(false);
    expect(parseAnswer(confirmQuestion, "Yes", false)).toBe(true);
    expect(parseAnswer(confirmQuestion, "maybe", false)).toBeUndefined();
  });

  test("select by number or value", () => {
    if (!selectQuestion) throw new Error("no select question");
    expect(parseAnswer(selectQuestion, "", "yarn")).toBe("yarn");
    expect(parseAnswer(selectQuestion, "4", "yarn")).toBe("pnpm");
    expect(parseAnswer(selectQuestion, "npm", "yarn")).toBe("npm");
    expect(parseAnswer(selectQuestion, "9", "yarn")).toBeUndefined();
  });
});
