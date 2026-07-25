import Components from "eslint-plugin-react/lib/util/Components.js";

function getSuggestionFixer(node, range, context) {
  return (fixer) => {
    return fixer.replaceTextRange(range, "ReactNode");
  };
}

function checkFunctionReturnType(node, onError) {
  const { returnType } = node;
  if (returnType == null) return;

  const { typeAnnotation } = returnType;
  if (typeAnnotation == null) return;

  const { typeName } = typeAnnotation;
  if (typeName == null) return;

  if (typeName.name !== "ReactNode") {
    onError(typeName, typeName.name, typeName.range);
  }
}

export default {
  meta: {
    type: "problem",

    docs: {
      description:
        "Forbid returning ReactElement or ReactElement | null in function components",
      category: "Best Practices",
      recommended: true,
    },

    messages: {
      invalidReturnType:
        'Returning "{{value}}" is forbidden. Return "ReactNode" instead.',
      replaceReturnType: 'Replace "{{value}}" by "ReactNode"',
    },

    hasSuggestions: true,
  },

  create: Components.detect((context, components) => {
    return {
      FunctionDeclaration(node) {
        if (!components.get(node)) return;

        checkFunctionReturnType(node, (typeName, currentName, range) =>
          context.report({
            node: typeName,
            messageId: "invalidReturnType",
            data: { value: currentName },
            suggest: [
              {
                messageId: "replaceReturnType",
                data: { value: currentName },
                fix: getSuggestionFixer(node, range, context),
              },
            ],
          }),
        );
      },
    };
  }),
};
