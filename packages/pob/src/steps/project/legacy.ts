import fs from "node:fs";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { isLegacyGeneratedDocs } from "../../utils/misc.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { getProjectKind } from "../settings.ts";
import { getProjectLibSettings } from "./settings.ts";

/**
 * Top-level entries of the package directory. InitialFiles only lists files
 * recursively, which would walk node_modules.
 */
export const listPackageEntries = (ctx: PackageContext): string[] => {
  try {
    return fs.readdirSync(ctx.dir);
  } catch {
    return [];
  }
};

/** from pob:core:package */
const packageLegacyPart: LegacyPart = {
  name: "package",
  writes: [
    "pkg.devDependencies",
    "pkg.scripts",
    "files:scripts/check-packages.mjs",
    "files:scripts/check-packages.js",
    "files:scripts/check-package.js",
    "files:scripts/check-package.mjs",
    "files:scripts/check-package.ts",
  ],
  run: (ctx) => {
    const { pkg, output, facts } = ctx;
    const name = ctx.initial.readJson<JsonObject>("package.json")?.name;
    if (name !== "@pob/root") {
      pkg.removeDevDependencies(["check-package-dependencies"]);
    }
    output.removed("scripts/check-packages.mjs");
    output.removed("scripts/check-packages.js");
    if (facts.inMonorepo) {
      pkg.removeScripts(["checks"]);
      return;
    }
    output.removed("scripts/check-package.js");
    output.removed("scripts/check-package.mjs");
    output.removed("scripts/check-package.ts");
    const checksScript = pkg.get<string>("scripts.checks");
    if (checksScript?.includes("node scripts/check-package")) {
      const checks = checksScript.replace(
        /( && )?node scripts\/check-packages?\.(mjs|js|ts)( && )?/,
        "",
      );
      if (checks === "") pkg.removeScripts(["checks"]);
      else pkg.set("scripts.checks", checks);
    }
  },
};

/** from pob:lib */
const libLegacyPart: LegacyPart = {
  name: "lib",
  writes: [
    "pkg.engines.yarn",
    "pkg.devDependencies",
    "files:lib-node14",
    "files:lib-node14/**",
    "files:lib-node16",
    "files:lib-node16/**",
    "files:index.js",
    "files:lib/index.js",
  ],
  run: (ctx) => {
    if (getProjectKind(ctx) !== "lib") return;
    const { pkg, output, initial } = ctx;
    pkg.delete("engines.yarn");
    pkg.removeDevDependencies(["lerna", "@pob/lerna-light"]);
    output.removed("lib-node14");
    output.removed("lib-node16");
    const { withBabel, withTypescript } = getProjectLibSettings(ctx);
    const indexContent = initial.read("index.js");
    if (
      !withBabel &&
      !withTypescript &&
      indexContent !== undefined &&
      !initial.exists("lib/index.js")
    ) {
      output.owned("lib/index.js", indexContent);
      output.removed("index.js");
    }
  },
};

/** from pob:app */
const appLegacyPart: LegacyPart = {
  name: "app",
  writes: [
    "pkg.engines.yarn",
    "files:next-env.d.ts",
    "files:lib-*",
    "files:lib-*/**",
    "files:generated-docs",
    "files:generated-docs/**",
  ],
  run: (ctx) => {
    if (getProjectKind(ctx) !== "app") return;
    const { pkg, output } = ctx;
    pkg.delete("engines.yarn");
    output.removed("next-env.d.ts");
    output.removed("generated-docs", { transient: true });
    for (const entry of listPackageEntries(ctx)) {
      if (entry.startsWith("lib-")) output.removed(entry);
    }
  },
};

/** from pob:lib:doc */
const docLegacyPart: LegacyPart = {
  name: "doc",
  writes: [
    "pkg.devDependencies",
    "pkg.scripts",
    "files:jsdoc.conf.json",
    "files:jsdoc.conf.js",
  ],
  run: (ctx) => {
    if (getProjectKind(ctx) === "app") return;
    const { pkg, output } = ctx;
    output.removed("jsdoc.conf.json");
    output.removed("jsdoc.conf.js");
    pkg.removeDevDependencies([
      "jsdoc",
      "minami",
      "jaguarjs-jsdoc",
      "typedoc-plugin-lerna-packages",
      "@chrp/typedoc-plugin-lerna-packages",
    ]);
    pkg.removeScripts(["generate:docs"]);
  },
};

/** the generated docs directory is now generated-docs: lib, app and doc */
const generatedDocsLegacyPart: LegacyPart = {
  name: "generated-docs",
  writes: ["files:docs", "files:docs/**"],
  run: (ctx) => {
    if (isLegacyGeneratedDocs(ctx.initial.exists)) ctx.output.removed("docs");
  },
};

export const projectLegacyParts: readonly LegacyPart[] = [
  packageLegacyPart,
  libLegacyPart,
  appLegacyPart,
  docLegacyPart,
  generatedDocsLegacyPart,
];
