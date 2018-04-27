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
      ImportDeclaration(path) {
        const node = path.node;
        if (node.source.value !== 'pob-babel') return;
        if (!node.specifiers) throw path.buildCodeFrameError('Expecting named parameters');
        node.specifiers.forEach(specifier => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            throw path.buildCodeFrameError('No default import expected');
          }

          const nodeReplacement = nodeReplacements.get(specifier.imported.name);

          if (!nodeReplacement) {
            throw path.buildCodeFrameError(`Unknown import: ${specifier.imported.name}`);
          }

          path.scope.bindings[specifier.local.name].referencePaths.forEach(ref =>
            ref.replaceWith(nodeReplacement)
          );
        });

        path.remove();
      },
    },
  };
};
