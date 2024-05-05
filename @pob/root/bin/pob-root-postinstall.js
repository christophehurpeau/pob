#!/usr/bin/env node
/* eslint-disable unicorn/no-await-expression-member */

import fs from "node:fs";
import path from "node:path";
import whichPmRuns from "which-pm-runs";

if (!process.env.INIT_CWD) {
  console.error(
    "Missing process.env.INIT_CWD. Did you use postinstall script ?",
  );
  process.exit(1);
}

process.chdir(process.env.PROJECT_CWD || process.env.INIT_CWD);

const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json")));

/* Check Package Manager */

const pm = process.env.POB_ROOT_FAKE_PM
  ? JSON.parse(process.env.POB_ROOT_FAKE_PM)
  : whichPmRuns() ||
    (fs.existsSync("package-lock.json") ? { name: "npm" } : undefined);

if (!pm) {
  console.error("Invalid pm, please run with postinstall hook!");
  process.exit(1);
}

if (pm.name !== "yarn" && pm.name !== "npm" && pm.name !== "bun") {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn or npm!`,
  );
  process.exit(1);
}

(await import("./postinstall/update-yarn.js")).default({ pkg, pm });
(await import("./postinstall/install-husky.js")).default({ pkg, pm });
(await import("./postinstall/install-github-workflows.js")).default({
  pkg,
  pm,
});
(await import("./postinstall/install-scripts.js")).default({ pkg, pm });

if (process.env.POB_EXPERIMENTAL_VSCODE_TASKS) {
  await (
    await import("./postinstall/install-vscode-tasks.js")
  ).default({ pkg, pm });
}
