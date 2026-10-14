// An unescaped line break is preceded by an even number of backslashes.
const UNESCAPED_LINEBREAK_PATTERN = /(?:^|[^\\])(?:\\\\)*[\n\r\u2028\u2029]/u;

const toDoubleQuotedString = (raw) =>
  `"${raw.slice(1, -1).replaceAll(/\\(\$\{|.)|"/gu, (match, escaped) => {
    if (escaped === "`" || escaped === "${") return escaped;
    if (match === '"') return '\\"';
    return match;
  })}"`;

export default {
  meta: {
    type: "suggestion",

    docs: {
      description:
        "Disallow template literals without interpolation, line break or tag",
      category: "Best Practices",
      recommended: true,
    },

    fixable: "code",

    messages: {
      useless:
        "Template literal without interpolation, line break or tag: use a string literal.",
    },
  },

  create: (context) => {
    return {
      TemplateLiteral(node) {
        if (
          node.expressions.length > 0 ||
          (node.parent.type === "TaggedTemplateExpression" &&
            node.parent.quasi === node) ||
          UNESCAPED_LINEBREAK_PATTERN.test(node.quasis[0].value.raw)
        ) {
          return;
        }

        context.report({
          node,
          messageId: "useless",
          fix: (fixer) =>
            // a string literal statement can become a directive ("use strict")
            node.parent.type === "ExpressionStatement"
              ? null
              : fixer.replaceText(
                  node,
                  toDoubleQuotedString(context.sourceCode.getText(node)),
                ),
        });
      },
    };
  },
};
