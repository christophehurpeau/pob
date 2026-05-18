import fs from "node:fs/promises";
import { format } from "oxfmt";

export async function ensureJsonFileFormatted(path) {
  try {
    const contentJson = await fs.readFile(path, "utf8");
    const { code: formattedPkg } = await format(path, contentJson, {
      printWidth: 80,
    });
    if (contentJson !== formattedPkg) {
      console.warn(`formatted json file ${path}`);
      await fs.writeFile(path, formattedPkg);
    }
  } catch {}
}
