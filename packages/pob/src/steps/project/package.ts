import { isDeepStrictEqual } from "node:util";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { parseAuthor } from "../../utils/untyped.ts";
import type { RepositoryMetadata } from "../core/gitRepository.ts";
import {
  getRepositoryMetadata,
  resolveGitRepository,
} from "../core/gitRepository.ts";
import { renderLicense } from "./licenses.ts";

const POSTINSTALL_COMMAND = "pob-root-postinstall";

const managedKeys = [
  "packageManager",
  "name",
  "type",
  "author",
  "license",
  "description",
  "keywords",
  "version",
  "publishConfig",
  "repository",
  "homepage",
  "bugs",
] as const;

const postinstallScripts = ["postinstall", "prepare", "postinstallDev"];

interface Author {
  name?: string;
  email?: string;
  url?: string;
}

const missingValueError = (description: string): Error =>
  new Error(
    `package.json: ${description}. Set it by hand: pob update does not prompt.`,
  );

const parsePkgAuthor = (pkg: JsonObject): Author | undefined =>
  typeof pkg.author === "string"
    ? parseAuthor(pkg.author)
    : (pkg.author as Author | undefined);

/**
 * repository, homepage and bugs of the root once its git step ran: computed
 * from the origin remote and the initial root package.json by the same
 * function as the git step, since the packages run before the root.
 * Undefined for an unknown git host: the root keeps its values, the packages
 * keep theirs.
 */
const getRootRepositoryMetadata = (
  ctx: PackageContext,
  rootPkg: JsonObject,
): RepositoryMetadata | undefined => {
  const { repository } = resolveGitRepository(
    ctx.facts.originUrl,
    rootPkg.repository,
    "the monorepo root package.json has no repository and there is no origin remote",
  );
  return repository && getRepositoryMetadata(repository, rootPkg.homepage);
};

const updateMetadata = (ctx: PackageContext, pkg: JsonObject): void => {
  const { facts } = ctx;
  const isMonorepoRoot = facts.isMonorepoRoot;
  const monorepoPackage = facts.inMonorepo;

  if (!facts.isRoot) delete pkg.packageManager;

  if (ctx.config.build && pkg.main && !pkg.exports) {
    throw missingValueError(
      '"exports" is missing while "main" is set: set "exports", for example to the value of "main"',
    );
  }

  if (!pkg.name) throw missingValueError('"name" is missing');
  if (isMonorepoRoot && (pkg.name as string).endsWith("-lerna")) {
    pkg.name = (pkg.name as string).replace(/-lerna$/, "-monorepo");
  }

  if (ctx.config.project.type === "app") pkg.type = "module";

  const rootPkg = monorepoPackage?.rootPkg;
  if (rootPkg) {
    if (!pkg.author && !pkg.authors && rootPkg.author) {
      pkg.author = rootPkg.author;
    }
    if (!pkg.type && rootPkg.type) pkg.type = rootPkg.type;
  }
  const defaultLicense = rootPkg?.license as string | undefined;

  const author = parsePkgAuthor(pkg);
  if (!pkg.authors) {
    if (!author?.name) throw missingValueError('"author" has no name');
    if (!author.email) throw missingValueError('"author" has no email');
  }
  if (!pkg.type) throw missingValueError('"type" is missing');
  if (!pkg.license && !defaultLicense) {
    throw missingValueError('"license" is missing');
  }

  if (rootPkg?.type === "module") pkg.type = "module";

  const rootRepository =
    monorepoPackage && rootPkg
      ? getRootRepositoryMetadata(ctx, rootPkg)
      : undefined;
  if (monorepoPackage && rootRepository) {
    pkg.repository = {
      type: "git",
      url: rootRepository.repository,
      directory: monorepoPackage.relative,
    };
    pkg.homepage = rootRepository.homepage;
    if (pkg.private) delete pkg.bugs;
    else pkg.bugs = rootRepository.bugs;
  }

  if (!pkg.authors && author) {
    pkg.author = `${author.name ?? ""} <${author.email ?? ""}>${author.url ? ` (${author.url})` : ""}`;
  }

  if (!pkg.license) {
    pkg.license = defaultLicense;
    const license = renderLicense(defaultLicense ?? "", {
      year: new Date().getFullYear(),
      author: (pkg.author as string | undefined) ?? "",
    });
    if (license !== undefined) ctx.output.owned("LICENSE", license);
  }

  if (pkg.private) {
    if (!pkg.description) delete pkg.description;
    if (!pkg.keywords || (pkg.keywords as unknown[]).length === 0) {
      delete pkg.keywords;
    }
  } else if (!pkg.keywords) {
    pkg.keywords = [];
  }

  if (!pkg.private && !pkg.version) pkg.version = "0.0.0";

  if (
    !pkg.private &&
    !pkg.publishConfig &&
    (pkg.name as string).startsWith("@")
  ) {
    pkg.publishConfig = { access: "public" };
  }
};

const installPostinstallScript = (
  scripts: Record<string, string>,
  scriptName: string,
): void => {
  if (!scripts[scriptName]?.includes(POSTINSTALL_COMMAND)) {
    scripts[scriptName] = POSTINSTALL_COMMAND;
  }
};

const uninstallPostinstallScript = (
  scripts: Record<string, string>,
  scriptName: string,
): void => {
  const script = scripts[scriptName];
  if (!script) return;
  if (script === POSTINSTALL_COMMAND) {
    Reflect.deleteProperty(scripts, scriptName);
  } else if (script.startsWith(`${POSTINSTALL_COMMAND} && `)) {
    // keeps the leading space of the yeoman generator: the result is stable
    scripts[scriptName] = script.slice(`${POSTINSTALL_COMMAND} && `.length - 1);
  } else if (script.includes(POSTINSTALL_COMMAND)) {
    throw new Error(`Could not remove ${POSTINSTALL_COMMAND}`);
  }
};

/**
 * pob-root-postinstall runs on install at the root only: postinstall with
 * yarn, prepare with the other package managers (prepare also runs on publish,
 * which public standalone packages need).
 */
const updatePostinstallScripts = (
  ctx: PackageContext,
  pkg: JsonObject,
  scripts: Record<string, string>,
): void => {
  const { facts } = ctx;
  const isYarn = facts.packageManager === "yarn";
  uninstallPostinstallScript(scripts, "postinstallDev");
  const installedScript = isYarn ? "postinstall" : "prepare";
  const otherScript = isYarn ? "prepare" : "postinstall";
  uninstallPostinstallScript(scripts, otherScript);
  const inMonorepoOrPrivate =
    facts.isMonorepoRoot || !!facts.inMonorepo || !!pkg.private;
  if (!inMonorepoOrPrivate || facts.isRoot) {
    installPostinstallScript(scripts, installedScript);
  } else {
    uninstallPostinstallScript(scripts, installedScript);
  }
};

const applyChanges = (
  ctx: PackageContext,
  before: JsonObject,
  after: JsonObject,
  keys: readonly string[],
  prefix: string[] = [],
): void => {
  for (const key of keys) {
    if (isDeepStrictEqual(before[key], after[key])) continue;
    if (after[key] === undefined) ctx.pkg.delete([...prefix, key]);
    else ctx.pkg.set([...prefix, key], after[key]);
  }
};

/** pob:core:package: metadata of package.json and the postinstall script */
export const packageStep = defineStep<PackageContext>({
  name: "package",
  writes: [
    ...managedKeys.map((key) => `pkg.${key}`),
    ...postinstallScripts.map((script) => `pkg.scripts.${script}`),
    "files:LICENSE",
    "files:yarn.lock",
    "files:pnpm-lock.yaml",
    "files:yarn-error.log",
  ],
  run(ctx) {
    // the yeoman generator ran first, on the package.json before pob
    const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
    const pkg = structuredClone(initialPkg);
    updateMetadata(ctx, pkg);
    applyChanges(ctx, initialPkg, pkg, managedKeys);

    const initialScripts = (initialPkg.scripts ?? {}) as Record<string, string>;
    const scripts = { ...initialScripts };
    updatePostinstallScripts(ctx, pkg, scripts);
    applyChanges(ctx, initialScripts, scripts, postinstallScripts, ["scripts"]);

    if (ctx.facts.inMonorepo) {
      ctx.output.removed("yarn.lock");
      ctx.output.removed("pnpm-lock.yaml");
    }
    ctx.output.removed("yarn-error.log");
  },
});
