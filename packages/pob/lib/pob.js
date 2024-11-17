#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import fs, {
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import minimist from "minimist";
import * as yeoman from "yeoman-environment";
import PobBaseGenerator from "./generators/pob/PobBaseGenerator.js";
import { __dirname } from "./pob-dirname.cjs";

process.on("unhandledRejection", (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});

const printUsage = () => {
  console.error("Usage: pob [monorepo] [lib|app|init]");
  console.error("       pob [monorepo] update [--force]");
  console.error("       pob add <packageName>");
};

const readJson = (filepath) => {
  try {
    return JSON.parse(readFileSync(filepath, "utf8"));
  } catch {
    return null;
  }
};

// const printVersion = () => {
//   console.log(pkg.version);
// };

const argv = minimist(process.argv.slice(2));

if (argv.version) {
  // printVersion();
  process.exit(0);
}

const env = yeoman.createEnv();

env.on("error", (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log("uncaughtException", err.stack || err.message || err);
});

env.registerStub(
  PobBaseGenerator,
  "pob",
  `${__dirname}/generators/pob/PobBaseGenerator.js`,
);

const projectPkg = readJson(path.resolve("./package.json"));
const monorepoArg = argv._[0] === "lerna" || argv._[0] === "monorepo";
let monorepo = monorepoArg || !!(projectPkg && projectPkg.workspaces);
const action = monorepoArg ? argv._[1] : argv._[0];

if (action === "add") {
  if (!projectPkg.workspaces) {
    throw new Error(
      "Missing workspaces field in package.json: not a lerna repo",
    );
  }

  const packageName = monorepoArg ? argv._[2] : argv._[1];

  if (!packageName) {
    console.error("Missing argument: packageName");
    printUsage();
    process.exit(1);
  }
  const packagesPath = packageName.startsWith("@")
    ? packageName
    : projectPkg.workspaces[0].replace(/\/\*$/, "");

  fs.mkdirSync(`${packagesPath}/${packageName}`, { recursive: true });
  writeFileSync(`${packagesPath}/${packageName}/.yo-rc.json`, "{}");
  writeFileSync(
    `${packagesPath}/${packageName}/package.json`,
    JSON.stringify({ name: packageName, version: "1.0.0-pre" }, null, 2),
  );
  console.log("> Creating new Package");
  spawnSync(process.argv[0], [process.argv[1]], {
    cwd: `${packagesPath}/${packageName}`,
    stdio: "inherit",
  });

  console.log("> Updating monorepo");
  spawnSync(process.argv[0], [process.argv[1], "update"], {
    stdio: "inherit",
  });
  process.exit(0);
}

if (action === "migrate-to-monorepo") {
  if (projectPkg.workspaces) {
    throw new Error("workspaces field already exists in package.json");
  }

  mkdirSync("packages");
  mkdirSync(`packages/${projectPkg.name}`);

  readdirSync(".").forEach((filename) => {
    if (
      ![
        ".git",
        ".vscode",
        ".github",
        ".husky",
        ".yarn",
        ".yarnrc.yml",
        "packages",
        "lint-staged.config.js",
        "yarn.lock",
      ].includes(filename)
    ) {
      execSync(`mv "${filename}" "packages/${projectPkg.name}/"`);
    }
  });

  const monorepoName = `${path.basename(process.cwd())}-monorepo`;
  const monorepoPkg = {
    private: true,
    name: monorepoName,
    version: projectPkg.version,
    author: projectPkg.author,
    license: projectPkg.license,
    repository: projectPkg.repository,
    engines: projectPkg.engines,
    packageManager: projectPkg.packageManager,
    workspaces: ["packages/*"],
  };

  writeFileSync("package.json", JSON.stringify(monorepoPkg, null, 2));

  monorepo = true;
}

const updateOnly = action === "update";
const init = action === "init";
const type = updateOnly || init ? null : action;
const fromPob = updateOnly && argv._[1] === "from-pob";

if (!existsSync(".yo-rc.json")) {
  if (updateOnly) {
    throw new Error("Cannot update.");
  }

  writeFileSync(".yo-rc.json", "{}");
}

if (
  existsSync("lerna.json") ||
  (projectPkg && (projectPkg.lerna || projectPkg.workspaces))
) {
  monorepo = true;
}

const options = {
  type,
  init,
  updateOnly,
  monorepo,
  fromPob,
  force: argv.force,
};

try {
  await env.run("pob", options);
} catch (error) {
  if (error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

// generator.on('error', (err) => {
//   console.error(err.stack || err.message || err);
//   process.exit(1);
// });
