import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import {
  getAppSettings,
  getLibSettings,
  getMonorepoSettings,
  getProjectKind,
} from "../settings.ts";

export const getInitialPackageName = (ctx: PackageContext): string =>
  (ctx.initial.readJson<JsonObject>("package.json")?.name ?? "") as string;

/** pob:app composes pob:common:husky only outside a monorepo */
export const composesHusky = (ctx: PackageContext): boolean =>
  getProjectKind(ctx) !== "app" || !ctx.facts.inMonorepo;

/** The options the orchestrators gave to pob:common:release */
export interface ReleaseOptions {
  enable: boolean;
  enablePublish: boolean;
  /** a build script must run before publishing */
  build: boolean;
  isMonorepo: boolean;
  ci: boolean;
  disableYarnGitCache: boolean;
}

export const getReleaseOptions = (ctx: PackageContext): ReleaseOptions => {
  const standalone = !ctx.facts.isMonorepoRoot && !ctx.facts.inMonorepo;
  const disableYarnGitCache = ctx.config.project.disableYarnGitCache !== false;
  switch (getProjectKind(ctx)) {
    case "lib": {
      const settings = getLibSettings(ctx.config);
      return {
        enable: standalone && settings.testing,
        enablePublish: true,
        build: settings.withBabel || settings.withTypescript,
        isMonorepo: false,
        ci: !!ctx.config.project.ci,
        disableYarnGitCache,
      };
    }
    case "app": {
      const settings = getAppSettings(ctx.config);
      return {
        enable:
          standalone &&
          !!settings.app.testing &&
          getInitialPackageName(ctx) !== "yarn-plugin-conventional-version",
        enablePublish: false,
        build:
          (settings.babel || ctx.config.build?.typescript === true) &&
          settings.app.type !== "expo",
        isMonorepo: false,
        ci: !!ctx.config.project.ci,
        disableYarnGitCache,
      };
    }
    case "monorepo": {
      const settings = getMonorepoSettings(ctx);
      return {
        enable: true,
        enablePublish:
          !settings.isAppProject ||
          settings.packages.some(({ pkg }) => !pkg.private),
        build: settings.hasRootBuild,
        isMonorepo: true,
        ci: !!settings.monorepo.ci,
        disableYarnGitCache,
      };
    }
    default:
      throw new Error("Unknown project kind");
  }
};
