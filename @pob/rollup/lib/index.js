import fs from "node:fs";
import path from "node:path";

export const nodeFormatToExt = (format, pkgType) => {
  if (format === "cjs" && pkgType === "module") return ".cjs";
  if (format === "cjs") return ".cjs.js";
  if (format === "es") return ".mjs";
  return `.${format}.js`;
};

export const resolveEntry = (cwd, entryName) => {
  let entryPath;
  ["ts", "tsx", "js", "jsx"].some((extension) => {
    const potentialEntryPath = path.resolve(
      cwd,
      "src",
      `${entryName}.${extension}`,
    );

    if (fs.existsSync(potentialEntryPath)) {
      entryPath = potentialEntryPath;
      return true;
    }

    return false;
  });

  if (!entryPath) {
    throw new Error(`Could not find entry "src/${entryName}" in path "${cwd}"`);
  }

  return entryPath;
};
