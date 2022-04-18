'use strict';

module.exports = function ({ types }, opts) {
  const { target, targetVersion } = opts;

  const createNodeEnvExpression = (nodeEnvValue, not) => {
    return types.binaryExpression(
      not ? '!==' : '===',
      types.memberExpression(
        types.memberExpression(
          types.identifier('process'),
          types.identifier('env'),
          false,
        ),
        types.identifier('NODE_ENV'),
        false,
      ),
      types.stringLiteral(nodeEnvValue),
    );
  };

  const createNode = (value) => {
    if (value === undefined) return types.identifier('undefined');
    if (value === null) return types.nullLiteral();
    return types[`${typeof value}Literal`](value);
  };

  const DEV_EXPRESSION = createNodeEnvExpression('production', true);
  const PROD_EXPRESSION = createNodeEnvExpression('production');
  const TEST_EXPRESSION = createNodeEnvExpression('test');

  const nodeReplacements = {
    IS_DEV: DEV_EXPRESSION,
    IS_PROD: PROD_EXPRESSION,
    IS_TEST: TEST_EXPRESSION,
    POB_TARGET: createNode(target),
    POB_TARGET_VERSION: createNode(targetVersion),
  };

  return {
    name: 'babel-preset-pob-env/replace-plugin',
    visitor: {
      ImportDeclaration(path) {
        const node = path.node;
        if (node.source.value !== 'pob-babel') return;
        if (!node.specifiers) {
          throw path.buildCodeFrameError(
            'Expecting named import for "pob-babel"',
          );
        }
        node.specifiers.forEach((specifier) => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            throw path.buildCodeFrameError('No default import expected');
          }

          const nodeReplacement = nodeReplacements[specifier.imported.name];

          if (!nodeReplacement) {
            throw path.buildCodeFrameError(
              `Unknown import: ${specifier.imported.name}`,
            );
          }

          path.scope.bindings[specifier.local.name].referencePaths.forEach(
            (ref) => ref.replaceWith(nodeReplacement),
          );
        });

        path.remove();
      },
      ReferencedIdentifier(path) {
        const { node } = path;
        if (path.parentPath.isMemberExpression({ object: node })) {
          return;
        }

        if (node.name === '__DEV__') {
          path.replaceWith(DEV_EXPRESSION);
        } else if (
          [
            '__POB_TARGET__',
            '__POB_TARGET_VERSION__',
            'BROWSER',
            'NODEJS',
            'SERVER',
          ].includes(node.name)
        ) {
          throw new Error(
            `Invalid Identifier found: "${node.name}". Import from pob-babel instead.`,
          );
        }
      },
    },
  };
};
