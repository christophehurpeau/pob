"use strict";

// eslint rule name → oxlint rule name, for every rule of the oxlint configs of
// @pob/eslint-config and @pob/eslint-config-typescript-react, frozen at the
// last version running them in eslint too.
const eslintToOxlintRuleNames = require("../data/eslint-to-oxlint-rule-names.json");

// plugins no longer loaded by @pob/eslint-config: eslint reports a directive
// naming one of their rules as "Definition for rule ... was not found"
const removedEslintPluginPrefixes = [
  "@pob/",
  "@typescript-eslint/",
  "jsx-a11y/",
  "react-hooks/",
  "react/",
  "regexp/",
  "unicorn/",
];

/** @param {string} ruleName */
const isRemovedEslintPluginRule = (ruleName) =>
  removedEslintPluginPrefixes.some((prefix) => ruleName.startsWith(prefix));

const directiveRegExp =
  /^\s*eslint-(disable-next-line|disable-line|disable|enable)(?=\s|$)/;

// same as eslint: the description starts at the first " -- "
const descriptionRegExp = /\s-{2,}\s/;

/**
 * @param {string} commentValue the comment without its delimiters
 */
const parseDirective = (commentValue) => {
  const [content, ...descriptionParts] = commentValue.split(descriptionRegExp);
  const match = directiveRegExp.exec(content);
  if (!match) return undefined;
  const [prefix, kind] = match;
  const ruleList = content.slice(prefix.length);
  return {
    kind,
    ruleNames: ruleList
      .split(",")
      .map((ruleName) => ruleName.trim())
      .filter(Boolean),
    description:
      descriptionParts.length > 0
        ? commentValue.slice(content.length).trim()
        : undefined,
  };
};

/**
 * @param {string[]} ruleNames
 */
const splitRuleNames = (ruleNames) => {
  /** @type {Set<string>} */
  const eslintRuleNames = new Set();
  /** @type {Set<string>} */
  const oxlintRuleNames = new Set();
  for (const ruleName of ruleNames) {
    const oxlintRuleName = eslintToOxlintRuleNames[ruleName];
    if (oxlintRuleName) {
      oxlintRuleNames.add(oxlintRuleName);
    } else if (!isRemovedEslintPluginRule(ruleName)) {
      eslintRuleNames.add(ruleName);
    }
  }
  return {
    eslintRuleNames: [...eslintRuleNames],
    oxlintRuleNames: [...oxlintRuleNames],
  };
};

/**
 * @param {"eslint" | "oxlint"} tool
 * @param {string} kind
 * @param {string[]} ruleNames
 * @param {string | undefined} description
 */
const formatDirective = (tool, kind, ruleNames, description) =>
  [`${tool}-${kind}`, ruleNames.join(", "), description]
    .filter(Boolean)
    .join(" ");

/**
 * Rewrites an eslint directive comment for @pob/eslint-config running the
 * moved rules in oxlint only: their names move to an `oxlint-` directive of
 * the same kind, rules of removed eslint plugins are dropped.
 *
 * @param {{ type: "CommentLine" | "CommentBlock"; value: string }} comment
 * @returns {string | null | undefined} the new comment text, `null` to remove
 *   the comment, `undefined` when unchanged
 */
const rewriteDirectiveComment = (comment) => {
  const directive = parseDirective(comment.value);
  if (!directive) return undefined;
  const { kind, ruleNames, description } = directive;

  // a blanket directive disables every rule, now in both tools
  if (ruleNames.length === 0) {
    const eslintDirective = `/* ${comment.value.trim()} */`;
    const oxlintDirective = formatDirective("oxlint", kind, [], description);
    return comment.type === "CommentLine"
      ? `${eslintDirective} // ${oxlintDirective}`
      : `${eslintDirective} /* ${oxlintDirective} */`;
  }

  const { eslintRuleNames, oxlintRuleNames } = splitRuleNames(ruleNames);
  if (oxlintRuleNames.length === 0) {
    if (eslintRuleNames.length === ruleNames.length) return undefined;
    if (eslintRuleNames.length === 0) return null;
  }

  const directives = [
    eslintRuleNames.length > 0 &&
      formatDirective("eslint", kind, eslintRuleNames, description),
    oxlintRuleNames.length > 0 &&
      formatDirective("oxlint", kind, oxlintRuleNames, description),
  ].filter(Boolean);

  if (comment.type === "CommentBlock") {
    return directives.map((text) => `/* ${text} */`).join(" ");
  }
  // a line comment ends the line: only the last directive can be one
  return directives
    .map((text, index) =>
      index === directives.length - 1 ? `// ${text}` : `/* ${text} */`,
    )
    .join(" ");
};

/**
 * @param {string} source
 * @param {{ type: string; value: string; start: number; end: number }[]} comments
 * @returns {string}
 */
const rewriteDirectiveComments = (source, comments) => {
  let result = source;
  // from the end, so that the offsets of the previous comments stay valid
  for (const comment of comments.toSorted((a, b) => b.start - a.start)) {
    if (comment.type !== "CommentLine" && comment.type !== "CommentBlock") {
      continue;
    }
    const replacement = rewriteDirectiveComment(
      /** @type {{ type: "CommentLine" | "CommentBlock"; value: string }} */ (
        comment
      ),
    );
    if (replacement === undefined) continue;

    let start = comment.start;
    let end = comment.end;
    if (replacement === null) {
      // remove the whole line when the comment is alone on it
      const lineStart = result.lastIndexOf("\n", start - 1) + 1;
      const lineEndIndex = result.indexOf("\n", end);
      const lineEnd = lineEndIndex === -1 ? result.length : lineEndIndex;
      const before = result.slice(lineStart, start);
      const after = result.slice(end, lineEnd);
      if (before.trim() === "" && after.trim() === "") {
        start = lineStart;
        end = lineEndIndex === -1 ? lineEnd : lineEnd + 1;
      } else if (before.trim() !== "") {
        // trailing comment: also remove the spaces before it
        start = lineStart + before.trimEnd().length;
      }
    }
    result = result.slice(0, start) + (replacement ?? "") + result.slice(end);
  }
  return result;
};

module.exports = {
  eslintToOxlintRuleNames,
  isRemovedEslintPluginRule,
  rewriteDirectiveComment,
  rewriteDirectiveComments,
};
