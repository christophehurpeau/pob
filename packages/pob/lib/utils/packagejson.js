import fs from "node:fs";

export default JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url)),
);
