"use strict";

/* eslint-disable complexity */
module.exports = (file, api, options) => {
  const j = api.jscodeshift.withParser("tsx");
  const root = j(file.source);
  let hasModifications = false;

  function processFunctionComponent(path) {
    const node = path.value;
    const { returnType } = node;
    if (returnType == null) return;
    if (returnType.type !== "TSTypeAnnotation") return;
    const { typeAnnotation } = returnType;
    if (typeAnnotation == null) return;

    if (
      typeAnnotation.type === "TSTypeReference" &&
      typeAnnotation.typeName &&
      typeAnnotation.typeName.type === "Identifier"
    ) {
      if (typeAnnotation.typeName.name === "ReactElement") {
        typeAnnotation.typeName.name = "ReactNode";
        hasModifications = true;
      }
    } else if (
      typeAnnotation.type === "TSUnionType" &&
      typeAnnotation.types.every((unionTypeItem) => {
        if (unionTypeItem.type === "TSTypeReference") {
          return (
            unionTypeItem.typeName &&
            unionTypeItem.typeName.type === "Identifier" &&
            unionTypeItem.typeName.name === "ReactElement"
          );
        }

        if (unionTypeItem.type === "TSNullKeyword") {
          return true;
        }

        return false;
      })
    ) {
      returnType.typeAnnotation = j.tsTypeReference(j.identifier("ReactNode"));
      hasModifications = true;
    }
  }

  root.find(j.FunctionDeclaration).forEach(processFunctionComponent);

  if (hasModifications) {
    root.find(j.ImportDeclaration).forEach((importDeclaration) => {
      const { node } = importDeclaration;
      if (node.source.value !== "react") return;
      if (node.importKind !== "type") return;

      node.specifiers = node.specifiers.filter((importSpecifier) => {
        if (importSpecifier.local.name !== "ReactElement") return true;
        if (importSpecifier.importKind !== "value") return true;
        return (
          j(importDeclaration)
            .closestScope()
            // eslint-disable-next-line unicorn/no-array-method-this-argument -- not an array
            .find(j.Identifier, { name: "ReactElement" })
            .filter((p) => {
              if (p.value.start === importSpecifier.local.start) return false;
              if (p.parentPath.value.type === "Property" && p.name === "key") {
                return false;
              }
              if (p.name === "property") return false;
              return true;
            })
            .size() > 0
        );
      });
      if (
        !node.specifiers.some(
          (specifier) =>
            specifier.type === "ImportSpecifier" &&
            specifier.imported.name === "ReactNode",
        )
      ) {
        node.specifiers.push(j.importSpecifier(j.identifier("ReactNode")));
      }
    });
  }

  return hasModifications ? root.toSource(options) : null;
};
