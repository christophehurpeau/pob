import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { hasVitestBrowserPlaywright } from "../settings.ts";
import { getE2eEnabled } from "./settings.ts";

const e2ePrepareScript = "test:e2e:prepare";

/**
 * Playwright e2e tests. The .gitignore entries are written by the gitignore
 * step, gated on the same e2e flag.
 */
export const e2eStep = defineStep<PackageContext>({
  name: "e2e",
  when: (ctx) => !ctx.facts.isMonorepoRoot,
  writes: [
    "pkg.devDependencies",
    `pkg.scripts.${e2ePrepareScript}`,
    "pkg.scripts.test:e2e",
  ],
  run: (ctx) => {
    const enable = !!getE2eEnabled(ctx);
    const { pkg } = ctx;
    const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
    pkg.addOrRemoveDevDependencies(enable, ["@playwright/test"]);
    pkg.addOrRemoveDevDependencies(
      enable || hasVitestBrowserPlaywright(initialPkg),
      ["playwright"],
    );
    const currentPrepare = pkg.get<string>(["scripts", e2ePrepareScript]);
    pkg.addOrRemoveScripts(enable, {
      // keeps the browsers added by hand, like webkit for iPhone projects
      [e2ePrepareScript]: currentPrepare?.startsWith("playwright install ")
        ? currentPrepare
        : "playwright install chromium",
      "test:e2e": "playwright test -c e2e/playwright.config.ts",
    });
  },
});
