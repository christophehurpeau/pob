import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runTransform } from "@pob/codemods";
import { format } from "oxfmt";

/**
 * Updates eslint-disable comments and eslint.config.js for
 * @pob/eslint-config running the rules checked by oxlint in oxlint only.
 */
export const runOxlintOnlyCodemods = async (cwd: string): Promise<void> => {
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd, encoding: "utf8" },
  )
    .split("\n")
    .filter((file) => /\.[cm]?[jt]sx?$/.test(file) && !file.endsWith(".d.ts"))
    .map((file) => path.join(cwd, file));
  console.log(
    "@pob/eslint-config 68: rewriting eslint-disable comments of rules checked by oxlint",
  );
  await runTransform("oxlint-directives", files, { silent: true });

  const eslintConfigPath = ["eslint.config.js", "eslint.config.mjs"]
    .map((fileName) => path.join(cwd, fileName))
    .find((filePath) => fs.existsSync(filePath));
  if (eslintConfigPath) {
    await runTransform("oxlint-eslint-config", [eslintConfigPath]);
    const { code } = await format(
      eslintConfigPath,
      fs.readFileSync(eslintConfigPath, "utf8"),
      { printWidth: 80 },
    );
    fs.writeFileSync(eslintConfigPath, code);
  }
};
