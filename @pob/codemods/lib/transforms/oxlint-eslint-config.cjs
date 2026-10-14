"use strict";

const {
  eslintToOxlintRuleNames,
  isRemovedEslintPluginRule,
} = require("../utils/oxlintDirectives.cjs");

// configs of @pob/eslint-config and @pob/eslint-config-typescript-react left
// without rules once oxlint runs every rule it supports
const removedConfigNames = new Set([
  "allowImplicitReturnType",
  "allowUnsafe",
  "allowUnsafeAsWarn",
  "app",
  "oxlint",
]);

const renamedConfigNames = new Map([
  ["nodeCommonjs", "node"],
  ["nodeModule", "node"],
]);

/**
 * Updates eslint.config.js for the major of @pob/eslint-config running every
 * rule supported by oxlint in oxlint only: removes the configs left empty,
 * renames the deprecated ones, and removes the rule entries of rules moved to
 * oxlint (reported: their options go in .oxlintrc.json).
 *
 * @type {import("jscodeshift").Transform}
 */
module.exports = (file, api) => {
  const j = api.jscodeshift.withParser("tsx");
  const root = j(file.source);
  let hasModifications = false;

  /** @param {any} node */
  const getLine = (node) => (node.loc ? `:${node.loc.start.line}` : "");

  /**
   * @param {any} key
   * @param {boolean} [computed]
   */
  const getKeyName = (key, computed) => {
    if (key.type === "Identifier" && !computed) return key.name;
    if (
      (key.type === "StringLiteral" || key.type === "Literal") &&
      typeof key.value === "string"
    ) {
      return key.value;
    }
    return undefined;
  };

  /** @param {any} node */
  const getPropertyName = (node) => getKeyName(node.property, node.computed);

  /** `<x>.configs.<name>` or `configs.<name>` */
  const isConfigsMember = (/** @type {any} */ node) =>
    node.type === "MemberExpression" &&
    ((node.object.type === "Identifier" && node.object.name === "configs") ||
      (node.object.type === "MemberExpression" &&
        getPropertyName(node.object) === "configs"));

  /**
   * Removes the closest spread element of an array containing `path`, like
   * `...apply({ configs: [] })`.
   *
   * @param {any} path
   */
  const removeEnclosingSpread = (path) => {
    let current = path.parent;
    while (current) {
      if (
        current.value.type === "SpreadElement" &&
        current.parent.value.type === "ArrayExpression"
      ) {
        current.prune();
        return true;
      }
      current = current.parent;
    }
    return false;
  };

  /** @param {any} node */
  const isConfigsProperty = (node) =>
    (node.type === "Property" || node.type === "ObjectProperty") &&
    getKeyName(node.key, node.computed) === "configs";

  /**
   * Removes an element of an array, and the apply() call whose `configs` it
   * leaves empty.
   *
   * @param {any} elementPath
   */
  const pruneArrayElement = (elementPath) => {
    const array = elementPath.parent;
    elementPath.prune();
    if (
      array.value.elements.length === 0 &&
      isConfigsProperty(array.parent.value)
    ) {
      removeEnclosingSpread(array);
    }
  };

  root
    .find(j.MemberExpression)
    .filter((path) => isConfigsMember(path.value))
    .forEach((path) => {
      const name = getPropertyName(path.value);
      if (!name) return;

      const renamed = renamedConfigNames.get(name);
      if (renamed) {
        path.value.property = j.identifier(renamed);
        path.value.computed = false;
        hasModifications = true;
        return;
      }

      if (!removedConfigNames.has(name)) return;

      const parent = path.parent.value;
      if (
        parent.type === "SpreadElement" &&
        path.parent.parent.value.type === "ArrayExpression"
      ) {
        pruneArrayElement(path.parent);
        hasModifications = true;
        return;
      }

      if (
        isConfigsProperty(parent) &&
        parent.value === path.value &&
        removeEnclosingSpread(path)
      ) {
        hasModifications = true;
        return;
      }

      api.report(
        `${file.path}${getLine(path.value)}: "configs.${name}" was removed, update this usage by hand.`,
      );
    });

  // rule entries of rules moved to oxlint
  root
    .find(j.Node)
    .filter(
      (path) =>
        (path.value.type === "Property" ||
          path.value.type === "ObjectProperty") &&
        getKeyName(path.value.key, path.value.computed) === "rules" &&
        path.value.value.type === "ObjectExpression",
    )
    .forEach((path) => {
      const rules = path.value.value;
      rules.properties = rules.properties.filter((/** @type {any} */ rule) => {
        const ruleName = getKeyName(rule.key, rule.computed);
        if (typeof ruleName !== "string") return true;
        const oxlintRuleName = eslintToOxlintRuleNames[ruleName];
        if (!oxlintRuleName && !isRemovedEslintPluginRule(ruleName)) {
          return true;
        }
        hasModifications = true;
        api.report(
          oxlintRuleName
            ? `${file.path}${getLine(rule)}: "${ruleName}" is checked by oxlint: configure "${oxlintRuleName}" in .oxlintrc.json instead.`
            : `${file.path}${getLine(rule)}: "${ruleName}" was removed.`,
        );
        return false;
      });
      if (rules.properties.length > 0) return;

      // remove the config when the rules were all it configured
      const config = path.parent;
      config.value.properties = config.value.properties.filter(
        (/** @type {any} */ property) => property !== path.value,
      );
      const isEmptyConfig = config.value.properties.every(
        (/** @type {any} */ property) =>
          ["files", "ignores", "name"].includes(
            getKeyName(property.key, property.computed) ?? "",
          ),
      );
      if (isEmptyConfig && config.parent.value.type === "ArrayExpression") {
        pruneArrayElement(config);
      }
    });

  return hasModifications ? root.toSource({ trailingComma: true }) : undefined;
};
