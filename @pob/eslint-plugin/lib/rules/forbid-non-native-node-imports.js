const libsToNativeNode = [
  {
    libs: ["chalk", "colorette"],
    replaceWith: "styleText from node:util",
  },
];

export default {
  meta: {
    type: "problem",

    docs: {
      description:
        "Forbid node-native import now that node solution is available in natively",
      category: "Best Practices",
      recommended: true,
    },

    messages: {
      forbidden:
        'import from "{{value}}" is forbidden. Replace with "{{nativeImport}}"',
    },
  },

  create: (context) => {
    const checkNode = (node) => {
      const importSource = node.source.value.trim();

      const lib = libsToNativeNode.find((lib) =>
        lib.libs.includes(importSource),
      );
      if (lib) {
        context.report({
          node,
          messageId: "forbidden",
          data: { value: importSource, nativeImport: lib.replaceWith },
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
