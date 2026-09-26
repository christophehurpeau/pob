import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import {
  getEnabledOxlintConfigRules,
  listOxlintRules,
} from "./test-utils/oxlint.js";

/*
 * inventory/oxlint-rules.json records a decision for every oxlint rule of the
 * plugins below, so an oxlint upgrade adding or removing rules fails here.
 * Decisions:
 * - enabled: in oxlint/*.json
 * - migrate: enabled in eslint, to move to oxlint (docs/oxlint-migration.md)
 * - eslint: kept in eslint
 * - evaluate: not used today, to evaluate (Phase 4 of the migration)
 * - rejected: not wanted
 */
const plugins = new Set([
  "eslint",
  "typescript",
  "unicorn",
  "import",
  "node",
  "react",
  "jsx_a11y",
  "oxc",
  "promise",
  "vitest",
]);
const decisions = new Set([
  "enabled",
  "migrate",
  "eslint",
  "evaluate",
  "rejected",
]);
const inventoryPath = new URL(
  "../inventory/oxlint-rules.json",
  import.meta.url,
);

describe("oxlint rules inventory", () => {
  /** @type {Record<string, string>} */
  let inventory;
  /** @type {string[]} */
  let oxlintRules;

  beforeAll(async () => {
    inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
    const rules = await listOxlintRules(import.meta.dirname);
    oxlintRules = rules
      .map(({ name }) => name)
      .filter((name) => plugins.has(name.slice(0, name.indexOf("/"))));
  });

  it("has a decision for every oxlint rule", () => {
    const oxlintRuleSet = new Set(oxlintRules);
    expect({
      newRules: oxlintRules.filter((name) => !Object.hasOwn(inventory, name)),
      removedRules: Object.keys(inventory).filter(
        (name) => !oxlintRuleSet.has(name),
      ),
    }).toEqual({ newRules: [], removedRules: [] });
  });

  it("has only known decisions", () => {
    expect(
      Object.entries(inventory).filter(
        ([, decision]) => !decisions.has(decision),
      ),
    ).toEqual([]);
  });

  it("marks as enabled exactly the rules of oxlint/*.json", () => {
    expect(
      Object.keys(inventory)
        .filter((name) => inventory[name] === "enabled")
        .toSorted(),
    ).toEqual(getEnabledOxlintConfigRules());
  });
});
