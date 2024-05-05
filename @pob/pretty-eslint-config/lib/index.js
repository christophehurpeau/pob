import fs from "node:fs/promises";
import sortEslintConfig from "@pob/sort-eslint-config";
import prettier from "prettier";

export default function prettyEslintConfig(eslintConfig, prettierOptions) {
  if (typeof eslintConfig === "string") {
    eslintConfig = JSON.parse(eslintConfig);
    if (typeof eslintConfig !== "object") {
      throw new TypeError(
        "Invalid eslint config: not an object after parsing string",
      );
    }
  } else if (typeof eslintConfig !== "object") {
    throw new TypeError("expected eslint config to be object or string");
  }

  if (typeof prettierOptions === "string") {
    throw new TypeError(
      `Please import "${prettierOptions}" and pass it as the second argument of prettyPkg`,
    );
  }

  sortEslintConfig(eslintConfig);
  return prettier.format(JSON.stringify(eslintConfig, undefined, 2), {
    filepath: ".eslintrc.json",
    printWidth: 80,
    ...prettierOptions,
  });
}

export async function write(eslintConfig, path, prettierOptions) {
  const string = await prettyEslintConfig(eslintConfig, prettierOptions);
  await fs.writeFile(path, string, "utf8");
}

export async function override(path, prettierOptions) {
  const eslintConfig = await fs.readFile(path, "utf8");
  return write(eslintConfig, path, prettierOptions);
}
