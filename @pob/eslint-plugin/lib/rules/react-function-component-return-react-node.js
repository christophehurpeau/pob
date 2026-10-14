// function components are named in PascalCase
const isComponentName = (name) => /^[A-Z]/.test(name);

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

  // React.ReactElement: check and replace the right side. React.ReactNode is
  // reported by @pob/react-named-import
  const nameNode =
    typeName.type === "TSQualifiedName" ? typeName.right : typeName;

  if (nameNode.name !== "ReactNode") {
    onError(nameNode, nameNode.name, nameNode.range);
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

  create: (context) => {
    return {
      FunctionDeclaration(node) {
        if (!node.id || !isComponentName(node.id.name)) return;

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
  },
};
