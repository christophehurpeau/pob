export default {
  meta: {
    type: "problem",

    docs: {
      description: "Use named react import as suggested in the doc",
      category: "Best Practices",
      recommended: true,
    },

    messages: {
      namespace:
        'import * as React from "react" is forbidden. Use named imports instead.',
      default:
        'import React from "react" is forbidden. Use named imports instead.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    const checkImportSpecifier = (node, messageId) => {
      const importDeclaration = node.parent;
      const importSource =
        importDeclaration &&
        importDeclaration.source &&
        importDeclaration.source.value &&
        String(importDeclaration.source.value).trim();
      if (importSource !== "react") return;
      context.report({ node, messageId });
    };

    const isReactDeclaredInScope = (node) => {
      const scope = sourceCode.getScope ? sourceCode.getScope(node) : null;
      return (
        scope &&
        ((scope.set && scope.set.get("React")) ||
          (scope.variables && scope.variables.find((v) => v.name === "React")))
      );
    };

    const checkReactUsage = (node, messageId = "namespace") => {
      if (!isReactDeclaredInScope(node)) {
        context.report({ node, messageId });
      }
    };

    return {
      ImportNamespaceSpecifier: (node) =>
        checkImportSpecifier(node, "namespace"),
      ImportDefaultSpecifier: (node) => checkImportSpecifier(node, "default"),
      MemberExpression: (node) => {
        if (
          node.object &&
          node.object.type === "Identifier" &&
          node.object.name === "React"
        ) {
          checkReactUsage(node.object, "namespace");
        }
      },
      TSQualifiedName: (node) => {
        if (
          node.left &&
          node.left.type === "Identifier" &&
          node.left.name === "React"
        ) {
          checkReactUsage(node.left, "namespace");
        }
      },
    };
  },
};
