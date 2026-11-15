import fs from "node:fs";
import { expect, test } from "vitest";
import { POB_SCHEMA_FILE } from "../steps/config.ts";
import { generatePobConfigSchema, serializeSchema } from "./generateSchema.ts";

test("pob.schema.json is generated from PobConfig: run `pnpm run generate:schema`", async () => {
  const committed = fs.readFileSync(
    new URL(`../../${POB_SCHEMA_FILE}`, import.meta.url),
    "utf8",
  );
  expect(committed).toBe(await serializeSchema(generatePobConfigSchema()));
});
