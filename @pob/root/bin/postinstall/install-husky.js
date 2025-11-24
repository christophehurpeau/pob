import fs from "node:fs";
import path from "node:path";
import husky from "husky";
import { assertYarnBerry } from "../../lib/assert-yarn-berry.js";
import { getPackageManagerCommands } from "./packageManagerHelpers.js";

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
    `${hookContent.trim()}\n`,
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
  assertYarnBerry(pm);
  const yarnConfig = readYarnConfigFile();
  const isYarnPnp = yarnConfig
    ? !yarnConfig.includes("nodeLinker: node-modules") &&
      !yarnConfig.includes("nodeLinker: pnpm")
    : false;

  /* Check legacy */

  ensureLegacyHuskyConfigDeleted();
  ensureHuskyNotInDevDependencies(pkg);

  /* Create Config */

  const shouldRunTest = () => pkg.scripts && pkg.scripts.test;
  const shouldRunChecks = () => pkg.scripts && pkg.scripts.checks;
  const shouldRunLint = () => pkg.scripts && pkg.scripts.lint;
  const shouldEnableTranscrypt = () =>
    fs.existsSync(path.resolve("scripts/transcrypt"));

  try {
    fs.mkdirSync(path.resolve(".husky"));
  } catch {}

  const {
    lockfile,
    pmExec,
    installOnDiffCommand,
    beforeDiffCommand = "",
    afterDiffCommand = "",
  } = getPackageManagerCommands(pm, true);

  writeHook("commit-msg", `${pmExec} pob-check-commit-msg $1`);
  writeHook(
    "pre-commit",
    `${pmExec} pob-root-lint-staged${
      shouldEnableTranscrypt()
        ? `
# Transcrypt pre-commit hook: fail if secret file in staging lacks the magic prefix "Salted" in B64
RELATIVE_GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || printf '')
CRYPT_DIR=$(git config transcrypt.crypt-dir 2>/dev/null || printf '%s/crypt' "\${RELATIVE_GIT_DIR}")
"\${CRYPT_DIR}/transcrypt" pre_commit
`
        : ""
    }`,
  );

  if (isYarnPnp) {
    // https://yarnpkg.com/features/zero-installs
    ensureHookDeleted("post-checkout");
    ensureHookDeleted("post-merge");
    ensureHookDeleted("post-rewrite");
  } else {
    const runInstallOnDiff = (additionalConditionInstall = "") => {
      return `
if [ -n "$(git diff HEAD@{1}..HEAD@{0} -- ${lockfile})" ]${additionalConditionInstall}; then
  ${beforeDiffCommand ? `${beforeDiffCommand}\n  ` : ""}${installOnDiffCommand} || true${afterDiffCommand ? `\n  ${afterDiffCommand}` : ""}
fi`;
    };

    writeHook("post-checkout", runInstallOnDiff());
    writeHook("post-merge", runInstallOnDiff());
    writeHook("post-rewrite", runInstallOnDiff(' | [ "$1" = "rebase" ]'));
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
