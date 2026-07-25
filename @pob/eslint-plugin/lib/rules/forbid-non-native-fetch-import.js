const fetchLibs = [
  "node-fetch",
  "cross-fetch",
  "isomorphic-fetch",
  "@whatwg-node/fetch",
];

export default {
  meta: {
    type: "problem",

    docs: {
      description:
        "Forbid node-fetch import now that fetch is available in node and browsers",
      category: "Best Practices",
      recommended: true,
    },

    messages: {
      forbidden:
        'import from "{{value}}" is forbidden. Fetch is available in browsers and node since 18.0.0.',
    },
  },

  create: (context) => {
    const checkNode = (node) => {
      const importSource = node.source.value.trim();

      if (fetchLibs.includes(importSource)) {
        context.report({
          node,
          messageId: "forbidden",
          data: { value: importSource },
        });
      }
    };
    return {
      ImportDeclaration: checkNode,
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkNode(node);
        }
      },
      ExportAllDeclaration: checkNode,
    };
  },
};
