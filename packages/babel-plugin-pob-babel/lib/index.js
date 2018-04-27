'use strict';

module.exports = function({ types }, opts) {
  const replacements = opts.replacements;

  const nodeReplacements = new Map(
    Object.keys(replacements).map(key => {
      const value = replacements[key];

      const node = (() => {
        if (value === undefined) return types.identifier('undefined');
        if (value === null) return types.nullLiteral();
        return types[`${typeof value}Literal`](replacements[key]);
      })();

      return [key, node];
    })
  );

  return {
    name: 'pob-babel', // not required
    visitor: {
      Program: {
        exit(path) {
          path.traverse({
            ImportDeclaration(path) {
              const node = path.node;
              if (node.source.value !== 'pob-babel') return;
              if (!node.specifiers) throw path.buildCodeFrameError('Expecting named parameters');
              node.specifiers.forEach(specifier => {
                if (specifier.type === 'ImportDefaultSpecifier') {
                  throw path.buildCodeFrameError('No default import expected');
                }
                if (!nodeReplacements.has(specifier.imported.name)) {
                  throw path.buildCodeFrameError(`Unknown import: ${specifier.imported.name}`);
                }
              });
              path.remove();
            },
          });
        },
      },

      ReferencedIdentifier(path) {
        const node = path.node;
        const binding = path.scope.bindings[node.name];
        if (!binding || !binding.path.parent.source.value === 'pob-babel') return;
        const importSpecifier = binding.path.node;
        const replacement = nodeReplacements.get(importSpecifier.imported.name);
        if (replacement) path.replaceWith(replacement);
      },
    },
  };
};
