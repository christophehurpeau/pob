// Same as react/jsx-no-leaked-render of eslint-plugin-react with its default
// options (ternary and coerce strategies), for React >= 18.

// left sides already coerced to a boolean: !x, a === b, Boolean(x), ...
const COERCED_TYPES = new Set([
  "UnaryExpression",
  "BinaryExpression",
  "CallExpression",
]);

const isCoerced = (node) =>
  node.type === "LogicalExpression"
    ? isCoerced(node.left) && isCoerced(node.right)
    : COERCED_TYPES.has(node.type);

const findVariable = (scope, name) => {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return undefined;
};

// a variable initialized with a boolean literal
const isBooleanVariable = (context, node) => {
  if (node.type !== "Identifier") return false;
  const variable = findVariable(context.sourceCode.getScope(node), node.name);
  const init = variable?.defs[0]?.node.init;
  return init?.type === "Literal" && typeof init.value === "boolean";
};

export default {
  meta: {
    type: "problem",

    docs: {
      description:
        "Disallow problematic leaked values from being rendered, like 0 in `{count && <Item />}`",
      category: "Possible Errors",
      recommended: true,
    },

    fixable: "code",

    messages: {
      noPotentialLeakedRender:
        "Potential leaked value that might cause unintentionally rendered values or rendering crashes",
    },
  },

  create: (context) => ({
    'JSXExpressionContainer > LogicalExpression[operator="&&"]'(node) {
      const { left } = node;
      if (isCoerced(left) || isBooleanVariable(context, left)) return;
      // React >= 18 renders nothing for an empty string
      if (left.type === "Literal" && left.value === "") return;

      context.report({
        node,
        messageId: "noPotentialLeakedRender",
        fix: (fixer) => {
          const text = context.sourceCode.getText(node);
          // after the left side and its parentheses
          const operatorIndex = text.indexOf(
            "&&",
            left.range[1] - node.range[0],
          );
          const leftText = text.slice(0, operatorIndex).trim();
          const rightText = text.slice(operatorIndex + 2).trim();
          return fixer.replaceText(node, `${leftText} ? ${rightText} : null`);
        },
      });
    },
  }),
};
