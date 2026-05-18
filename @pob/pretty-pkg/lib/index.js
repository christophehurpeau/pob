import fs from "node:fs/promises";
import { format } from "oxfmt";

export default async function prettyPkg(pkg, prettierOptions) {
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

  if (prettierOptions !== undefined) {
    console.warn("prettierOptions is deprecated and has no effect.");
  }

  const { code: formatted } = await format(
    "package.json",
    `${JSON.stringify(pkg, undefined, 2)}\n`,
    { printWidth: 80 },
  );
  return formatted;
}

export async function write(pkg, path, prettierOptions) {
  const string = await prettyPkg(pkg, prettierOptions);
  await fs.writeFile(path, string, "utf8");
}

export async function override(path, prettierOptions) {
  const pkg = await fs.readFile(path, "utf8");
  await write(pkg, path, prettierOptions);
}
