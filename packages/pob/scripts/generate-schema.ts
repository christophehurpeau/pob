import fs from "node:fs";
import {
  generatePobConfigSchema,
  serializeSchema,
} from "../src/schema/generateSchema.ts";
import { POB_SCHEMA_FILE } from "../src/steps/config.ts";

fs.writeFileSync(
  new URL(`../${POB_SCHEMA_FILE}`, import.meta.url),
  await serializeSchema(generatePobConfigSchema()),
);
