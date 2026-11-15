import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { packageManagerRun } from "../../utils/packageManager.ts";
import { getProjectKind } from "../settings.ts";
import { escapeHtml } from "./escape.ts";
import { planUntrackBuild } from "./gitIndex.ts";
import type { ProjectAppSettings } from "./settings.ts";
import { getProjectAppSettings, shouldEnableHashSlash } from "./settings.ts";

const isApp = (ctx: PackageContext): boolean => getProjectKind(ctx) === "app";

const updateHashSlashImport = (
  ctx: PackageContext,
  settings: ProjectAppSettings,
): void => {
  const { pkg } = ctx;
  if (shouldEnableHashSlash(settings.type)) {
    pkg.set(["imports", "#/*"], `./${settings.srcDirectory}/*`);
    return;
  }
  const imports = pkg.get<JsonObject>("imports");
  if (!imports) return;
  pkg.delete(["imports", "#/*"]);
  if (Object.keys(imports).every((key) => key === "#/*")) {
    pkg.delete("imports");
  }
};

/**
 * Consumers and their tools (bundlers, type-aware lint) resolve the package
 * through package.json, not through the tsconfig paths.
 */
const updateUntranspiledLibraryEntry = (
  ctx: PackageContext,
  settings: ProjectAppSettings,
): void => {
  const { pkg } = ctx;
  const entry =
    ["ts", "tsx", "js"]
      .map((extension) => `./${settings.srcDirectory}/index.${extension}`)
      .find((entryPath) => ctx.initial.exists(entryPath)) ??
    `./${settings.srcDirectory}/index.${settings.useTypescript ? "ts" : "js"}`;
  if (!pkg.get("main")) pkg.set("main", entry);
  const exports = pkg.get("exports");
  if (!exports) {
    pkg.set("exports", { ".": entry });
  } else if (typeof exports === "object" && !(exports as JsonObject)["."]) {
    pkg.set("exports", { ".": entry, ...(exports as JsonObject) });
  }
};

/** what pob:app wrote itself */
export const appStep = defineStep<PackageContext>({
  name: "app",
  when: isApp,
  writes: [
    "pkg.imports",
    "pkg.main",
    "pkg.exports",
    "pkg.expo",
    "pkg.scripts.upgrade-expo",
    "files:coverage",
    "files:coverage/**",
    "files:dist",
    "files:dist/**",
  ],
  run(ctx) {
    const { pkg, output } = ctx;
    const settings = getProjectAppSettings(ctx);

    output.removed("coverage", { transient: true });
    // the build output of a distributed node app can be committed
    if (!settings.buildInGit) output.removed("dist", { transient: true });

    updateHashSlashImport(ctx, settings);
    if (settings.type === "untranspiled-library") {
      updateUntranspiledLibraryEntry(ctx, settings);
    }

    if (settings.type === "expo") {
      pkg.set("expo", { install: { exclude: ["typescript"] } });
    } else {
      pkg.delete("expo");
    }
    pkg.addOrRemoveScripts(settings.type === "expo", {
      "upgrade-expo": "expo install expo@57 --fix",
    });

    if (!settings.buildInGit) {
      planUntrackBuild(ctx, settings.buildDirectory);
    }
  },
});

const viteConfigFileNames = [
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "vite.config.mts",
];

const viteConfigTemplate = `import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
  },
});
`;

const viteIndexHtmlTemplate = (name: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(name)}</title>
  </head>
  <body>
    <script type="module" src="./index.ts"></script>
  </body>
</html>
`;

const viteIndexTsTemplate = (name: string): string =>
  `document.body.append("${escapeHtml(name)}");\n`;

/** pob:app:vite */
export const appViteStep = defineStep<PackageContext>({
  name: "app:vite",
  when: (ctx) =>
    isApp(ctx) &&
    (ctx.config.app?.type === "vite" ||
      ctx.config.app?.type === "vite-with-server"),
  reads: ["pkg.name"],
  writes: [
    "pkg.devDependencies",
    "pkg.scripts.build",
    "pkg.scripts.build:analyze",
    "pkg.scripts.build:client",
    "pkg.scripts.build:server",
    "pkg.scripts.preview",
    "pkg.scripts.serve",
    "pkg.scripts.start",
    "pkg.scripts.start:prod",
    "files:vite.config.js",
    "files:src/index.html",
    "files:src/index.ts",
  ],
  run(ctx) {
    const { pkg, output } = ctx;
    const run = (script: string): string =>
      packageManagerRun(ctx.facts.packageManager, script);

    pkg.addDevDependencies(["vite"]);

    if (ctx.config.app?.type === "vite-with-server") {
      pkg.addScripts({
        build: `${run("build:client")} && ${run("build:server")}`,
        "build:client": "vite build --outDir dist/client",
        "build:server":
          "vite build --ssr src/entry-server.tsx --outDir dist/server",
        preview: `${run("build")} && ${run("start:prod")}`,
        start: "node server.js",
        "start:prod": "NODE_ENV=production node server.js",
      });
      return;
    }

    pkg.addScripts({
      "build:analyze": "ENABLE_ANALYZER=true vite build",
      build: "vite build",
      start: "vite",
      serve: "vite preview",
    });

    // a new app: the files are never overwritten
    if (viteConfigFileNames.some((fileName) => ctx.initial.exists(fileName))) {
      return;
    }
    const name = pkg.get<string>("name") ?? "";
    output.seed("vite.config.js", viteConfigTemplate, { format: "oxfmt" });
    output.seed("src/index.html", viteIndexHtmlTemplate(name), {
      format: "oxfmt",
    });
    output.seed("src/index.ts", viteIndexTsTemplate(name), { format: "oxfmt" });
  },
});

/** pob:app:expo */
export const appExpoStep = defineStep<PackageContext>({
  name: "app:expo",
  when: (ctx) => isApp(ctx) && ctx.config.app?.type === "expo",
  writes: ["pkg.main"],
  run(ctx) {
    ctx.pkg.set("main", "./src/AppEntry.tsx");
  },
});
