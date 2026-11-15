/**
 * The questions of `pob init`, `pob lib`, `pob app` and `pob add`, defined
 * declaratively from the shape of the pob config (enum -> select, boolean ->
 * confirm, string -> input), with the defaults of the old yeoman prompts.
 * Only the keys that are missing are asked.
 */
import type { AppType } from "../engine/config.ts";
import type { JsonObject } from "../engine/model.ts";
import { getAtPath } from "../engine/tracker.ts";
import {
  detectStorybook,
  detectStorybookReactNative,
} from "../steps/settings.ts";
import {
  detectAlouette,
  getRepoName,
  latestLTS,
  parseRepositoryUrl,
} from "../utils/misc.ts";
import { parseAuthor } from "../utils/untyped.ts";

export type QuestionKind = "select" | "confirm" | "input";

export interface PromptFacts {
  /** standalone package or monorepo root */
  isRoot: boolean;
  isMonorepoRoot: boolean;
  /** a package of a monorepo */
  inMonorepo: boolean;
  /** package.json of the monorepo root, for a package of a monorepo */
  rootPkg: JsonObject | undefined;
  /** basename of the directory, default of the package name */
  dirName: string;
  /** git config user.name and user.email */
  gitUser: { name?: string; email?: string };
  hasOriginRemote: boolean;
  /** monorepo root: package.json of the workspace packages */
  workspacePkgs: JsonObject[];
  /** .circleci/config.yml or .github/workflows exist */
  hasCiConfig: boolean;
}

export interface QuestionState {
  /** pob.json being built */
  config: JsonObject;
  /** package.json being built. author is kept as an object until finalized */
  pkg: JsonObject;
  facts: PromptFacts;
  /** answers that are not stored as such */
  scratch: JsonObject;
}

export interface Question {
  file: "pob.json" | "package.json";
  /** dotted path in the file */
  key: string;
  kind: QuestionKind;
  message: string;
  choices?: readonly string[];
  default?: (state: QuestionState) => unknown;
  when?: (state: QuestionState) => boolean;
  /** asked on a TTY only: left unset otherwise, the steps have a default */
  optional?: boolean;
  /** how to set it by hand, when it is not just the key in the file */
  hint?: string;
  isSet?: (state: QuestionState) => boolean;
  apply?: (state: QuestionState, value: unknown) => void;
}

/** Asks one question, returns the answer (the default when empty). */
export type Ask = (
  question: Question,
  defaultValue: unknown,
) => Promise<unknown>;

const splitKey = (key: string): string[] => key.split(".");

const targetOf = (state: QuestionState, question: Question): JsonObject =>
  question.file === "pob.json" ? state.config : state.pkg;

export const getValue = (state: QuestionState, question: Question): unknown =>
  getAtPath(targetOf(state, question), splitKey(question.key));

export const setAtPath = (
  target: JsonObject,
  segments: readonly string[],
  value: unknown,
): void => {
  let current = target;
  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (next === null || typeof next !== "object" || Array.isArray(next)) {
      current[segment] = {};
    }
    current = current[segment] as JsonObject;
  }
  const last = segments.at(-1);
  if (last !== undefined) current[last] = value;
};

const isSet = (state: QuestionState, question: Question): boolean =>
  question.isSet
    ? question.isSet(state)
    : getValue(state, question) !== undefined;

const applyAnswer = (
  state: QuestionState,
  question: Question,
  value: unknown,
): void => {
  if (question.apply) question.apply(state, value);
  else setAtPath(targetOf(state, question), splitKey(question.key), value);
};

const config = (state: QuestionState, key: string): unknown =>
  getAtPath(state.config, splitKey(key));

const projectType = (state: QuestionState): unknown =>
  config(state, "project.type");

const isLibPackage = (state: QuestionState): boolean =>
  !state.facts.isMonorepoRoot && projectType(state) === "lib";

const isAppPackage = (state: QuestionState): boolean =>
  !state.facts.isMonorepoRoot && projectType(state) === "app";

export const appTypes: readonly AppType[] = [
  "alp",
  "vite",
  "vite-with-server",
  "next.js",
  "node",
  "node-library",
  "untranspiled-library",
  "alp-node",
  "expo",
  "other",
];

/** app types built by the transpiler: they need a build config */
const transpiledAppTypes: readonly unknown[] = [
  "node",
  "node-library",
  "alp-node",
];

const NO_BUNDLER = "none";

const bundlers = ["rollup-esbuild", "tsc", "esbuild", "rollup-typescript"];

const defaultBuildConfig = (bundler: string): JsonObject => ({
  bundler,
  typescript: true,
  entries: ["index"],
  envs: [{ target: "node", version: latestLTS }],
});

const parsedAuthor = (state: QuestionState): JsonObject =>
  (state.pkg.author as JsonObject | undefined) ?? {};

/** the package step copies the author of the monorepo root */
const needsAuthor = (state: QuestionState): boolean =>
  !state.pkg.authors && !state.facts.rootPkg?.author;

const hasRepository = (state: QuestionState): boolean =>
  state.facts.hasOriginRemote || !!parseRepositoryUrl(state.pkg.repository);

const monorepoCi = (state: QuestionState): boolean =>
  config(state, "monorepo.ci") === true;

const monorepoTesting = (state: QuestionState): boolean =>
  config(state, "monorepo.testing") === true;

const libTesting = (state: QuestionState): unknown =>
  config(state, "lib.testing");

export const questions: readonly Question[] = [
  // PobBaseGenerator
  {
    file: "pob.json",
    key: "project.type",
    kind: "select",
    message: "What kind of project is this ?",
    choices: ["lib", "app"],
    default: (state) =>
      (state.pkg.dependencies as JsonObject | undefined)?.next ? "app" : "lib",
  },
  {
    file: "pob.json",
    key: "project.packageManager",
    kind: "select",
    message: "Which package manager do you want to use ?",
    choices: ["yarn", "npm", "bun", "pnpm"],
    default: () => "yarn",
    when: (state) => state.facts.isRoot,
  },
  {
    file: "pob.json",
    key: "project.yarnNodeLinker",
    kind: "select",
    message: "Which linker do you want to use ?",
    choices: ["node-modules", "pnp", "pnpm"],
    default: () => "node-modules",
    optional: true,
    when: (state) =>
      state.facts.isRoot && config(state, "project.packageManager") === "yarn",
  },
  {
    file: "pob.json",
    key: "project.ci",
    kind: "confirm",
    message: "Would you like ci with github actions ?",
    default: () => true,
    when: (state) => state.facts.isRoot,
  },

  // CorePackageGenerator
  {
    file: "package.json",
    key: "name",
    kind: "input",
    message: "Package name",
    default: (state) => state.facts.dirName,
  },
  {
    file: "package.json",
    key: "private",
    kind: "confirm",
    message: "Private package ?",
    default: () => false,
    optional: true,
    // apps and monorepo roots are always private (see finalizeAnswers)
    when: (state) => isLibPackage(state),
    apply: (state, value) => {
      if (value === true) state.pkg.private = true;
      else state.scratch.private = false;
    },
    isSet: (state) =>
      state.pkg.private !== undefined || state.scratch.private !== undefined,
  },
  {
    file: "package.json",
    key: "description",
    kind: "input",
    message: "Description",
    optional: true,
    when: (state) => !state.facts.isMonorepoRoot,
  },
  {
    file: "package.json",
    key: "author.name",
    hint: 'set "author" in package.json: "Name <email> (url)"',
    kind: "input",
    message: "Author's name",
    default: (state) => state.facts.gitUser.name,
    when: needsAuthor,
    isSet: (state) => !!parsedAuthor(state).name,
  },
  {
    file: "package.json",
    key: "author.email",
    hint: 'set "author" in package.json: "Name <email> (url)"',
    kind: "input",
    message: "Author's email",
    default: (state) => state.facts.gitUser.email,
    when: needsAuthor,
    isSet: (state) => !!parsedAuthor(state).email,
  },
  {
    file: "package.json",
    key: "author.url",
    kind: "input",
    message: "Author's homepage",
    optional: true,
    when: needsAuthor,
    isSet: (state) => !!parsedAuthor(state).url,
  },
  {
    file: "package.json",
    key: "type",
    kind: "select",
    message: "Package type",
    choices: ["commonjs", "module"],
    default: () => "commonjs",
    // the package step sets "module" for apps and copies the type of the root
    when: (state) => projectType(state) !== "app" && !state.facts.rootPkg?.type,
  },
  {
    file: "package.json",
    key: "license",
    kind: "select",
    message: "License type",
    choices: ["MIT", "ISC", "UNLICENSED"],
    default: () => "MIT",
    when: (state) => !state.facts.rootPkg?.license,
  },

  // CoreGitGenerator, without an origin remote or a repository
  {
    file: "package.json",
    key: "repository",
    kind: "select",
    message: "Which git host service would you like ?",
    choices: ["github", "gitlab", "bitbucket"],
    default: () => "github",
    hint: 'set "repository" in package.json, or add an origin remote',
    when: (state) => state.facts.isRoot,
    isSet: (state) =>
      hasRepository(state) || state.scratch.gitHost !== undefined,
    apply: (state, value) => {
      state.scratch.gitHost = value;
    },
  },
  {
    file: "package.json",
    key: "repository",
    kind: "input",
    message: "Username or organization",
    hint: 'set "repository" in package.json, or add an origin remote',
    when: (state) => state.facts.isRoot && !state.facts.hasOriginRemote,
    isSet: hasRepository,
    apply: (state, value) => {
      const name = (state.pkg.name as string | undefined) ?? "";
      state.pkg.repository = `https://${String(state.scratch.gitHost)}.com/${String(value)}/${getRepoName(name)}.git`;
    },
  },

  // CoreRenovateGenerator
  {
    file: "pob.json",
    key: "renovate.enable",
    kind: "confirm",
    message: "Enable renovate ?",
    default: () => true,
    when: (state) => !state.facts.inMonorepo,
  },

  // PobLibGenerator
  {
    file: "pob.json",
    key: "lib.documentation",
    kind: "confirm",
    message: "Would you like documentation (manually generated) ?",
    default: () => true,
    // forced to false in a monorepo package (see finalizeAnswers)
    when: (state) => isLibPackage(state) && !state.facts.inMonorepo,
  },
  {
    file: "pob.json",
    key: "lib.testing",
    kind: "confirm",
    message: "Would you like testing ?",
    default: () => false,
    when: isLibPackage,
    apply: (state, value) => {
      setAtPath(state.config, ["lib", "testing"], value ? {} : false);
    },
  },
  {
    file: "pob.json",
    key: "lib.testing.runner",
    kind: "select",
    message: "Testing runner ?",
    choices: ["vitest", "node"],
    default: () => "vitest",
    // a monorepo package uses the runner of the monorepo
    when: (state) =>
      isLibPackage(state) && !state.facts.inMonorepo && !!libTesting(state),
  },
  {
    file: "pob.json",
    key: "lib.testing.codecov",
    kind: "confirm",
    message: "Would you like codecov ?",
    default: () => false,
    when: (state) =>
      isLibPackage(state) && !state.facts.inMonorepo && !!libTesting(state),
  },
  {
    file: "pob.json",
    key: "lib.e2e",
    kind: "confirm",
    message: "Would you like e2e testing (Playwright) ?",
    default: () => false,
    when: isLibPackage,
  },
  {
    file: "pob.json",
    key: "lib.buildInGit",
    kind: "confirm",
    message: "Would you like the build output committed in git ?",
    default: () => false,
    optional: true,
    when: isLibPackage,
  },

  // PobAppGenerator
  {
    file: "pob.json",
    key: "app.type",
    kind: "select",
    message: "What kind of app is this ?",
    choices: appTypes,
    default: () => "alp",
    when: isAppPackage,
  },
  {
    file: "pob.json",
    key: "app.export",
    kind: "confirm",
    message: "Use next export ?",
    default: () => false,
    optional: true,
    when: (state) =>
      isAppPackage(state) && config(state, "app.type") === "next.js",
  },
  {
    file: "pob.json",
    key: "app.testing",
    kind: "confirm",
    message: "Do you want testing ?",
    default: () => false,
    when: isAppPackage,
  },
  {
    file: "pob.json",
    key: "app.codecov",
    kind: "confirm",
    message: "Do you want codecov ?",
    default: () => true,
    optional: true,
    when: (state) =>
      isAppPackage(state) && config(state, "app.testing") === true,
  },
  {
    file: "pob.json",
    key: "app.e2e",
    kind: "confirm",
    message: "Do you want e2e testing (Playwright) ?",
    default: () => false,
    when: isAppPackage,
  },
  {
    file: "pob.json",
    key: "app.storybook",
    kind: "confirm",
    message: "Do you want storybook ?",
    default: (state) => detectStorybookReactNative([state.pkg]),
    optional: true,
    when: (state) =>
      isAppPackage(state) && config(state, "app.type") === "expo",
  },
  {
    file: "pob.json",
    key: "app.alouette",
    kind: "confirm",
    message: "Do you use alouette ?",
    default: (state) => detectAlouette(state.pkg),
    optional: true,
    when: (state) =>
      isAppPackage(state) && config(state, "app.type") === "expo",
  },

  // build config (package.json#pob before): the old typescript prompt of
  // CommonTranspilerGenerator never ran, the babel one is for a removed setup
  {
    file: "pob.json",
    key: "build.bundler",
    kind: "select",
    message: "How are the sources built ?",
    choices: [NO_BUNDLER, ...bundlers],
    default: () => NO_BUNDLER,
    hint: 'set "build" in pob.json, {} for an untranspiled library',
    when: isLibPackage,
    isSet: (state) => state.config.build !== undefined,
    apply: (state, value) => {
      state.config.build =
        value === NO_BUNDLER ? {} : defaultBuildConfig(String(value));
    },
  },
  {
    file: "pob.json",
    key: "build.bundler",
    kind: "select",
    message: "How is the app built ?",
    choices: bundlers,
    default: () => "rollup-esbuild",
    hint: `set "build" in pob.json, for example ${JSON.stringify({ bundler: "rollup-esbuild", typescript: true, entries: ["index"], envs: [{ target: "node", version: latestLTS }] })}`,
    when: (state) =>
      isAppPackage(state) &&
      transpiledAppTypes.includes(config(state, "app.type")),
    isSet: (state) => state.config.build !== undefined,
    apply: (state, value) => {
      state.config.build = defaultBuildConfig(String(value));
    },
  },

  // PobMonorepoGenerator
  {
    file: "pob.json",
    key: "monorepo.ci",
    kind: "confirm",
    message: "Would you like ci with github actions ?",
    default: (state) => state.facts.hasCiConfig,
    when: (state) => state.facts.isMonorepoRoot,
  },
  {
    file: "pob.json",
    key: "monorepo.disablePushWorkflow",
    kind: "confirm",
    message: "Would you like to DISABLE push workflow ?",
    default: () => false,
    optional: true,
    when: (state) => state.facts.isMonorepoRoot && monorepoCi(state),
  },
  {
    file: "pob.json",
    key: "monorepo.testing",
    kind: "confirm",
    message: "Would you like testing ?",
    default: () => true,
    when: (state) => state.facts.isMonorepoRoot && monorepoCi(state),
  },
  {
    file: "pob.json",
    key: "monorepo.testRunner",
    kind: "select",
    message: "What testing runner would you like ?",
    choices: ["node", "vitest"],
    default: () => "node",
    when: (state) => state.facts.isMonorepoRoot && monorepoTesting(state),
  },
  {
    file: "pob.json",
    key: "monorepo.e2eTesting",
    kind: "confirm",
    message: "Would you like e2e testing ?",
    default: () => true,
    when: (state) => state.facts.isMonorepoRoot && monorepoCi(state),
  },
  {
    file: "pob.json",
    key: "monorepo.codecov",
    kind: "confirm",
    message: "Would you like code coverage ?",
    default: () => true,
    when: (state) =>
      state.facts.isMonorepoRoot && monorepoCi(state) && monorepoTesting(state),
  },
  {
    file: "pob.json",
    key: "monorepo.documentation",
    kind: "confirm",
    message: "Would you like documentation ?",
    default: () => true,
    when: (state) =>
      state.facts.isMonorepoRoot &&
      monorepoCi(state) &&
      projectType(state) !== "app",
  },
  {
    file: "pob.json",
    key: "monorepo.typescript",
    kind: "confirm",
    message: "Would you like typescript monorepo ?",
    default: () => true,
    when: (state) => state.facts.isMonorepoRoot,
  },
  {
    file: "pob.json",
    key: "monorepo.eslint",
    kind: "confirm",
    message: "Would you like eslint in monorepo ?",
    default: () => true,
    when: (state) => state.facts.isMonorepoRoot,
  },
  {
    file: "pob.json",
    key: "monorepo.storybook",
    kind: "confirm",
    message: "Would you like storybook ?",
    default: (state) =>
      detectStorybook([state.pkg, ...state.facts.workspacePkgs]),
    optional: true,
    when: (state) => state.facts.isMonorepoRoot,
  },
  {
    file: "pob.json",
    key: "monorepo.storybookReactNative",
    kind: "confirm",
    message: "Would you like the on-device react-native storybook ?",
    default: (state) =>
      detectStorybookReactNative([state.pkg, ...state.facts.workspacePkgs]),
    optional: true,
    when: (state) => state.facts.isMonorepoRoot,
  },
];

export const createQuestionState = (
  configValue: JsonObject,
  pkg: JsonObject,
  facts: PromptFacts,
): QuestionState => {
  const clonedPkg = structuredClone(pkg);
  if (typeof clonedPkg.author === "string") {
    clonedPkg.author = { ...parseAuthor(clonedPkg.author) };
  }
  return {
    config: structuredClone(configValue),
    pkg: clonedPkg,
    facts,
    scratch: {},
  };
};

export interface ResolveOptions {
  /** undefined without a TTY: nothing is asked */
  ask: Ask | undefined;
  /** ask the optional questions too (they are left unset otherwise) */
  askOptional: boolean;
}

/**
 * Asks the missing keys in order, applying each answer before evaluating the
 * next `when`. Returns the required questions that could not be asked.
 */
export const resolveQuestions = async (
  questionList: readonly Question[],
  state: QuestionState,
  { ask, askOptional }: ResolveOptions,
): Promise<Question[]> => {
  const missing: Question[] = [];
  for (const question of questionList) {
    if (question.when && !question.when(state)) continue;
    if (isSet(state, question)) continue;
    if (question.optional && (!ask || !askOptional)) continue;
    if (!ask) {
      missing.push(question);
      continue;
    }
    const answer = await ask(question, question.default?.(state));
    if (answer === undefined || answer === "") continue;
    applyAnswer(state, question, answer);
  }
  return missing;
};

interface Author {
  name?: string;
  email?: string;
  url?: string;
}

const formatAuthor = (author: Author): string =>
  `${author.name ?? ""} <${author.email ?? ""}>${author.url ? ` (${author.url})` : ""}`;

/**
 * Values the old generators set without asking, and the package.json author
 * back to a string.
 */
export const finalizeAnswers = (state: QuestionState): void => {
  if (state.facts.isMonorepoRoot || projectType(state) === "app") {
    state.pkg.private = true;
  }
  if (
    state.facts.inMonorepo &&
    isLibPackage(state) &&
    config(state, "lib.documentation") === undefined
  ) {
    setAtPath(state.config, ["lib", "documentation"], false);
  }
  const author = state.pkg.author;
  if (author && typeof author === "object") {
    state.pkg.author = formatAuthor(author);
  }
};

export class MissingAnswersError extends Error {
  constructor(
    missing: readonly Question[],
    {
      pobJsonPath,
      pkgPath,
    }: {
      pobJsonPath: string;
      pkgPath: string;
    },
  ) {
    const lines = new Map<string, string>();
    for (const question of missing) {
      const id = `${question.file}#${question.key}`;
      if (lines.has(id)) continue;
      const where = question.file === "pob.json" ? pobJsonPath : pkgPath;
      const choices = question.choices
        ? ` (${question.choices.join(", ")})`
        : "";
      const how = question.hint ?? `set "${question.key}" in ${where}`;
      lines.set(id, `  - ${id}${choices}: ${how}`);
    }
    super(
      `Missing pob config, and no TTY to ask for it:\n${[...lines.values()].join("\n")}\nKeys that depend on these values are not listed yet.`,
    );
    this.name = "MissingAnswersError";
  }
}
