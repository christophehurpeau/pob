/* eslint-disable complexity */

import fs from "node:fs";
import path from "node:path";
import husky from "husky";
import semver from "semver";

const ensureLegacyHuskyConfigDeleted = () => {
  try {
    fs.unlinkSync(path.resolve("husky.config.js"));
  } catch {}
  try {
    fs.unlinkSync(path.resolve(".huskyrc"));
  } catch {}
};

const ensureHuskyNotInDevDependencies = (pkg) => {
  if (pkg.devDependencies && pkg.devDependencies.husky) {
    throw new Error(
      "Found husky in devDependencies. Husky is provided by @pob/root, please remove",
    );
  }
};

const writeHook = (hookName, hookContent) => {
  fs.writeFileSync(
    path.resolve(`.husky/${hookName}`),
    `#!/usr/bin/env sh\n\n${hookContent.trim()}\n`,
    {
      mode: "755",
    },
  );
};

const ensureHookDeleted = (hookName) => {
  try {
    fs.unlinkSync(path.resolve(`.husky/${hookName}`));
  } catch {}
};

const readYarnConfigFile = () => {
  try {
    return fs.readFileSync(path.resolve(".yarnrc.yml"));
  } catch {
    return "";
  }
};

export default function installHusky({ pkg, pm }) {
  const yarnMajorVersion = pm.name === "yarn" && semver.major(pm.version);
  const isYarnBerry = pm.name === "yarn" && yarnMajorVersion >= 2;
  const yarnConfig = isYarnBerry && readYarnConfigFile();
  const isYarnPnp =
    !yarnConfig.includes("nodeLinker: node-modules") &&
    !yarnConfig.includes("nodeLinker: pnpm");

  /* Check legacy */

  ensureLegacyHuskyConfigDeleted();
  ensureHuskyNotInDevDependencies(pkg);

  /* Create Config */

  const shouldRunTest = () => pkg.scripts && pkg.scripts.test;
  const shouldRunChecks = () => pkg.scripts && pkg.scripts.checks;
  const shouldRunLint = () => pkg.scripts && pkg.scripts.lint;

  try {
    fs.mkdirSync(path.resolve(".husky"));
  } catch {}

  const { lockfile, pmExec, installOnDiffCommand } = (() => {
    if (pm.name === "yarn") {
      return {
        lockfile: "yarn.lock",
        pmExec: "yarn",
        installOnDiffCommand: `yarn install ${
          isYarnBerry
            ? "--immutable"
            : "--prefer-offline --pure-lockfile --ignore-optional"
        }`,
      };
    }
    if (pm.name === "npm") {
      return {
        lockfile: "package-lock.json",
        pmExec: "npx --no-install",
        installOnDiffCommand: "npm i",
      };
    }
    if (pm.name === "bun") {
      return {
        lockfile: "bun.lockb",
        pmExec: "bun run",
        installOnDiffCommand: "bun i",
      };
    }

    throw new Error(
      `Package manager not supported: ${pm.name}. Please run with yarn, npm or bun !`,
    );
  })();

  writeHook("commit-msg", `${pmExec} commitlint --edit $1`);
  writeHook("pre-commit", `${pmExec} pob-root-lint-staged`);

  if (isYarnPnp) {
    ensureHookDeleted("post-checkout");
    ensureHookDeleted("post-merge");
    ensureHookDeleted("post-rewrite");
  } else {
    const runInstallOnDiff = (() => {
      return `
if [ -n "$(git diff HEAD@{1}..HEAD@{0} -- ${lockfile})" ]; then
  ${installOnDiffCommand} || true
fi`;
    })();

    // https://yarnpkg.com/features/zero-installs
    writeHook("post-checkout", runInstallOnDiff);
    writeHook("post-merge", runInstallOnDiff);
    writeHook("post-rewrite", runInstallOnDiff);
  }

  const prePushHook = [];

  if (shouldRunChecks()) {
    prePushHook.push(`${pm.name} run checks`);
  }

  if (shouldRunLint()) {
    prePushHook.push(`${pm.name} run lint`);
  }

  if (shouldRunTest()) {
    const getTestCommand = () => {
      if (pkg.devDependencies?.jest) {
        return "test --watchAll=false --changedSince=origin/main";
      }
      if (pkg.devDependencies?.vitest) {
        return "test --run --changed origin/main";
      }
      return "test";
    };
    prePushHook.push(`${pmExec} ${getTestCommand()}`);
  }

  if (prePushHook.length > 0) {
    writeHook(
      "pre-push",
      `
# z40 is the value matching the empty blob/commit/tree SHA (zero x 40)
z40=0000000000000000000000000000000000000000
branch_ref=$(git symbolic-ref HEAD)

while read local_ref local_sha remote_ref remote_sha
do
  # Skip if branch deletion
  if [ "$local_sha" != "$z40" ]; then
    if [ "$local_ref" = "$branch_ref" ]; then
      ${prePushHook.join(" && ")}
    fi
  fi
done
`,
    );
  } else {
    ensureHookDeleted("pre-push");
  }

  process.stdout.write(husky(".husky"));
}
