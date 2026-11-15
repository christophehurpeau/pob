/**
 * Options the lib and app orchestrators (pob:lib, pob:app) passed to the
 * generators of the project group.
 */
import type { AppType, MonorepoConfig } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import type { LibSettings } from "../settings.ts";
import { getAppSettings, getLibSettings } from "../settings.ts";

/** monorepo config of the root, for a package of a monorepo or its root */
export const getRootMonorepoConfig = (
  ctx: PackageContext,
): MonorepoConfig | undefined =>
  (ctx.facts.isMonorepoRoot ? ctx.config : ctx.facts.inMonorepo?.rootConfig)
    ?.monorepo;

/**
 * pob:lib forced `documentation: false` in the packages of a monorepo, whatever
 * the stored config.
 */
export const getProjectLibSettings = (ctx: PackageContext): LibSettings => {
  const settings = getLibSettings(ctx.config);
  return ctx.facts.inMonorepo
    ? { ...settings, documentation: false }
    : settings;
};

const hashSlashAppTypes: readonly AppType[] = [
  "alp",
  "vite",
  "vite-with-server",
  "alp-node",
  "next.js",
  "expo",
];

export const shouldEnableHashSlash = (appType: AppType): boolean =>
  hashSlashAppTypes.includes(appType);

export interface ProjectAppSettings {
  type: AppType;
  srcDirectory: string;
  buildDirectory: string;
  /** typescript, also when only type-checked */
  useTypescript: boolean;
  /** the build output is committed: dist stays out of .gitignore */
  buildInGit: boolean;
}

export const getProjectAppSettings = (
  ctx: PackageContext,
): ProjectAppSettings => {
  const settings = getAppSettings(ctx.config);
  const { app } = settings;
  if (app.type === ("remix" as AppType)) {
    throw new Error(
      "remix has been removed. Please migrate to 'vite' or 'expo'.",
    );
  }
  if (app.type === ("pobpack" as AppType)) {
    throw new Error("pobpack is no longer supported.");
  }
  if (app.type === "next.js") {
    throw new Error(
      "nextjs has been removed. Please migrate to 'vite', 'vite-with-server' or 'expo'.",
    );
  }
  const monorepoTypescript =
    ctx.facts.inMonorepo?.rootConfig.monorepo?.typescript;
  return {
    type: app.type,
    srcDirectory: settings.srcDirectory,
    buildDirectory: settings.buildDirectory,
    useTypescript:
      settings.typescript ||
      ctx.config.build?.typescript === "check-only" ||
      monorepoTypescript === "check-only",
    buildInGit: !!app.distribute && !!app.buildInGit,
  };
};
