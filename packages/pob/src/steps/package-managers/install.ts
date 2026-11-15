import { isDeepStrictEqual } from "node:util";
import { FAILSAFE_SCHEMA, dump, load } from "js-yaml";
import type { PackageManager } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import type { EffectDefinition } from "../../engine/effects.ts";
import type { JsonObject, TrackedJson } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { getPnpmArgs, parsePnpmWorkspace } from "./pnpm.ts";
import { runCommand } from "./shared.ts";
import { parseYarnrc } from "./yarn.ts";

/** package.json keys whose change requires an install */
const installKeys = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "dependenciesMeta",
  "peerDependenciesMeta",
  "resolutions",
  "overrides",
  "pnpm",
  "workspaces",
  "packageManager",
  "devEngines",
] as const;

const lockfiles: Record<PackageManager, string> = {
  yarn: "yarn.lock",
  pnpm: "pnpm-lock.yaml",
  npm: "package-lock.json",
  bun: "bun.lock",
};

/** written by every install, absent before the first one */
const installMarkers: Record<PackageManager, string> = {
  yarn: ".yarn/install-state.gz",
  pnpm: "node_modules/.modules.yaml",
  npm: "node_modules/.package-lock.json",
  bun: "node_modules",
};

const changedInstallKeys = (
  get: (key: string) => unknown,
  initialPkg: JsonObject,
): string[] =>
  installKeys.filter((key) => !isDeepStrictEqual(get(key), initialPkg[key]));

/** compared as read back with FAILSAFE_SCHEMA: formatting and types aside */
const yamlConfigChanged = (
  model: TrackedJson,
  initialContent: string | undefined,
  parse: (content: string) => JsonObject,
): boolean =>
  !isDeepStrictEqual(
    load(dump(model.snapshot()), { schema: FAILSAFE_SCHEMA }) ?? {},
    parse(initialContent ?? ""),
  );

const packageManagerConfigChanged = (
  ctx: PackageContext,
  packageManager: PackageManager,
): string | undefined => {
  switch (packageManager) {
    case "yarn": {
      const yarnrc = ctx.model("yarnrc", ".yarnrc.yml", parseYarnrc);
      return yamlConfigChanged(
        yarnrc,
        ctx.initial.read(".yarnrc.yml"),
        parseYarnrc,
      )
        ? ".yarnrc.yml"
        : undefined;
    }
    case "pnpm": {
      const workspace = ctx.model(
        "pnpmWorkspace",
        "pnpm-workspace.yaml",
        parsePnpmWorkspace,
      );
      return yamlConfigChanged(
        workspace,
        ctx.initial.read("pnpm-workspace.yaml"),
        parsePnpmWorkspace,
      )
        ? "pnpm-workspace.yaml"
        : undefined;
    }
    case "bun": {
      const bunfig = ctx.output.get("bunfig.toml");
      return bunfig?.strategy === "owned" &&
        bunfig.content !== ctx.initial.read("bunfig.toml")
        ? "bunfig.toml"
        : undefined;
    }
    case "npm":
      return undefined;
    default:
      throw new Error(`Unsupported package manager: ${String(packageManager)}`);
  }
};

/** Why an install is needed: nothing when the install is up to date. */
export const getInstallReasons = (
  ctx: PackageContext,
  packageManager: PackageManager,
): string[] => {
  const reasons: string[] = [];
  const lockfile = lockfiles[packageManager];
  const lockfileContent = ctx.initial.read(lockfile);
  if (lockfileContent === undefined) reasons.push(`no ${lockfile}`);
  if (!ctx.initial.exists(installMarkers[packageManager])) {
    reasons.push("not installed");
  }

  const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
  for (const key of changedInstallKeys(
    (path) => ctx.pkg.get(path),
    initialPkg,
  )) {
    reasons.push(`package.json ${key} changed`);
  }
  const configFile = packageManagerConfigChanged(ctx, packageManager);
  if (configFile) reasons.push(`${configFile} changed`);

  for (const workspacePackage of ctx.workspacePackages) {
    const changedKeys = changedInstallKeys(
      (path) => workspacePackage.pkg.peek(path),
      workspacePackage.initial.readJson<JsonObject>("package.json") ?? {},
    );
    for (const key of changedKeys) {
      reasons.push(`${workspacePackage.location}/package.json ${key} changed`);
    }
    if (
      lockfileContent !== undefined &&
      !lockfileContent.includes(workspacePackage.location)
    ) {
      reasons.push(`${workspacePackage.location} is not in ${lockfile}`);
    }
  }
  return reasons;
};

interface InstallCommands {
  install: { args: string[]; env?: Record<string, string> };
  dedupe: boolean;
}

const installCommands: Record<PackageManager, InstallCommands> = {
  yarn: {
    install: {
      args: ["install"],
      // pob just modified package.json, the lockfile must be allowed to
      // change, in particular in CI
      env: { YARN_ENABLE_IMMUTABLE_INSTALLS: "false" },
    },
    dedupe: true,
  },
  pnpm: {
    install: { args: ["install", "--no-frozen-lockfile"] },
    dedupe: true,
  },
  bun: {
    install: { args: ["install", "--save-text-lockfile"] },
    dedupe: false,
  },
  npm: { install: { args: ["install"] }, dedupe: false },
};

/** `pnpm with <range>` when the running pnpm is too old */
const commandArgs = (
  packageManager: PackageManager,
  cwd: string,
  args: string[],
): string[] =>
  packageManager === "pnpm" ? [...getPnpmArgs(cwd), ...args] : args;

const formatCommand = (
  packageManager: PackageManager,
  args: readonly string[],
  env?: Record<string, string>,
): string =>
  [
    ...Object.entries(env ?? {}).map(([key, value]) => `${key}=${value}`),
    packageManager,
    ...args,
  ].join(" ");

const commandEffect = ({
  id,
  packageManager,
  args,
  reason,
  after,
  env,
  ignoreFailure,
  mayModify,
}: {
  id: string;
  packageManager: PackageManager;
  args: string[];
  reason: string;
  after?: readonly string[];
  env?: Record<string, string>;
  ignoreFailure?: boolean;
  mayModify?: readonly string[];
}): EffectDefinition => ({
  id,
  reason,
  after,
  mayModify,
  command: formatCommand(packageManager, args, env),
  run: ({ cwd }) => {
    runCommand(cwd, packageManager, commandArgs(packageManager, cwd, args), {
      env,
      ignoreFailure,
    });
  },
});

/**
 * The script run after an install. With npm, a monorepo root runs preversion
 * and a standalone package builds only when it has a bundler.
 */
const getBuildScript = (
  ctx: PackageContext,
  packageManager: PackageManager,
): string | undefined => {
  const hasBundler = !!ctx.config.build?.bundler;
  if (packageManager === "npm" && !ctx.facts.isMonorepoRoot) {
    return hasBundler && ctx.pkg.get("scripts.build") ? "build" : undefined;
  }
  if (ctx.pkg.get("scripts.preversion")) return "preversion";
  if (packageManager !== "npm" && ctx.pkg.get("scripts.build")) return "build";
  return undefined;
};

const planInstall = (
  ctx: PackageContext,
  packageManager: PackageManager,
  reasons: readonly string[],
): void => {
  const commands = installCommands[packageManager];
  ctx.effects.add(
    commandEffect({
      id: "install",
      packageManager,
      args: commands.install.args,
      env: commands.install.env,
      reason: reasons.join(", "),
      after: ["yarn-set-version", "yarn-plugins"],
      mayModify: [lockfiles[packageManager]],
    }),
  );
  if (commands.dedupe) {
    ctx.effects.add(
      commandEffect({
        id: "dedupe",
        packageManager,
        args: ["dedupe"],
        reason: "after install",
        after: ["install"],
        mayModify: [lockfiles[packageManager]],
      }),
    );
  }
  const buildScript = getBuildScript(ctx, packageManager);
  if (buildScript) {
    ctx.effects.add(
      commandEffect({
        id: "build",
        packageManager,
        args: ["run", buildScript],
        reason: "after install",
        after: ["install", "dedupe", "yarn-sdks", "yarn-format"],
        // the yeoman generators ignored build failures, except for npm
        ignoreFailure: packageManager !== "npm",
      }),
    );
  }
};

const yarnToolEffectIds = new Set([
  "yarn-set-version",
  "yarn-plugins",
  "yarn-sdks",
]);

const planYarnTools = (ctx: PackageContext, installed: boolean): void => {
  if (
    ctx.facts.yarnNodeLinker === "pnp" &&
    (installed || !ctx.initial.exists(".yarn/sdks"))
  ) {
    ctx.effects.add(
      commandEffect({
        id: "yarn-sdks",
        packageManager: "yarn",
        args: ["dlx", "@yarnpkg/sdks", "vscode"],
        reason: installed ? "after install" : "no .yarn/sdks",
        after: ["install", "dedupe"],
        mayModify: [".vscode/**", ".yarn/sdks/**"],
      }),
    );
  }
  const toolEffects = ctx.effects
    .list()
    .filter((effect) => yarnToolEffectIds.has(effect.id));
  if (toolEffects.length === 0) return;
  ctx.effects.add(
    commandEffect({
      id: "yarn-format",
      packageManager: "yarn",
      args: ["oxfmt", ".vscode", ".yarnrc.yml"],
      reason: `after ${toolEffects.map((effect) => effect.id).join(", ")}`,
      after: ["install", "dedupe", ...yarnToolEffectIds],
      mayModify: [".vscode/**", ".yarnrc.yml"],
    }),
  );
};

/**
 * Install, dedupe and build after pob changed the dependencies or the package
 * manager config, or when nothing is installed: the yeoman generators ran them
 * on every run.
 */
export const installStep = defineStep<PackageContext>({
  name: "install",
  when: (ctx) => ctx.facts.isRoot,
  reads: [
    ...installKeys.map((key) => `pkg.${key}`),
    "pkg.scripts.preversion",
    "pkg.scripts.build",
    "yarnrc",
    "pnpmWorkspace",
    "files:bunfig.toml",
  ],
  run(ctx) {
    const packageManager = ctx.facts.packageManager;
    const reasons = ctx.options.fromPob
      ? []
      : getInstallReasons(ctx, packageManager);
    const installed = reasons.length > 0;
    if (installed) planInstall(ctx, packageManager, reasons);
    if (packageManager === "yarn") planYarnTools(ctx, installed);
  },
});
