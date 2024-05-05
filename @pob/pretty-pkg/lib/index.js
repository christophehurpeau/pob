import fs from "node:fs/promises";
import sortPkg from "@pob/sort-pkg";
import prettier from "prettier";

export default function prettyPkg(pkg, prettierOptions) {
  if (typeof pkg === "string") {
    pkg = JSON.parse(pkg);
    if (typeof pkg !== "object") {
      throw new TypeError(
        "Invalid package: not an object after parsing string",
      );
    }
  } else if (typeof pkg !== "object") {
    throw new TypeError("expected pkg to be object or string");
  }

  if (typeof prettierOptions === "string") {
    throw new TypeError(
      `Please import "${prettierOptions}" and pass it as the second argument of prettyPkg`,
    );
  }

  sortPkg(pkg);
  return prettier.format(JSON.stringify(pkg, undefined, 2), {
    filepath: "package.json",
    printWidth: 80,
    ...prettierOptions,
  });
}

export async function write(pkg, path, prettierOptions) {
  const string = await prettyPkg(pkg, prettierOptions);
  await fs.writeFile(path, string, "utf8");
}

export async function override(path, prettierOptions) {
  const pkg = await fs.readFile(path, "utf8");
  await write(pkg, path, prettierOptions);
}
