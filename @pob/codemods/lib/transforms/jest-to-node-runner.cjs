/* eslint-disable unicorn/prefer-array-some */
/* eslint-disable unicorn/no-array-method-this-argument */

'use strict';

const { prependImport } = require('../utils/prependImport.cjs');

const jestToNodeGlobalMethods = {
  test: 'test',
  describe: 'describe',
  it: 'it',
  beforeAll: 'before',
  afterAll: 'after',
  beforeEach: 'beforeEach',
  afterEach: 'afterEach',
};
const propertiesMap = {
  toBe: { default: 'equal', not: 'notEqual' },
  toStrictEqual: { default: 'equal', not: 'notEqual' },
  toEqual: { default: 'equal', not: 'notEqual' },
};

// const mocks = {
//   toHaveBeenCalledTimes: {
//     default: 'mock.calls.length',
//   },
// };

module.exports = (file, api, options) => {
  if (
    !(
      file.path.endsWith('.test.js') ||
      file.path.endsWith('.test.ts') ||
      file.path.endsWith('.test.tsx')
    )
  ) {
    throw new Error(`Invalid file: "${file.path}"`);
  }

  const j = api.jscodeshift.withParser('tsx');
  const root = j(file.source);

  function updateTopLevelMethods() {
    const topLevelMethodsUsed = new Set();

    root
      .find(j.CallExpression, {
        callee: {
          type: j.Identifier.name,
          name: (name) => Object.keys(jestToNodeGlobalMethods).includes(name),
        },
      })
      .replaceWith((p) => {
        const { value } = p;
        topLevelMethodsUsed.add(value.callee.name);

        return j.callExpression(
          j.identifier(jestToNodeGlobalMethods[value.callee.name]),
          value.arguments,
        );
      });

    if (topLevelMethodsUsed.size > 0) {
      prependImport(
        j,
        root,
        j.importDeclaration(
          [...topLevelMethodsUsed].map((method) =>
            j.importSpecifier(j.identifier(method)),
          ),
          j.stringLiteral('node:test'),
        ),
      );
    }
  }

  function updateAssertions() {
    let hasAssertions = false;

    root
      .find(j.MemberExpression, {
        object: {
          callee: { name: 'expect' },
        },
      })
      .forEach((memberExpressionPath) => {
        const { value: memberExpression, parentPath } = memberExpressionPath;
        let memberExpressionPathToReplace = memberExpressionPath;
        let propertyName = memberExpression.property.name;
        let not = false;
        if (propertyName === 'not') {
          not = true;
          memberExpressionPathToReplace = parentPath;
          propertyName = parentPath.value.property.name;
        }

        if (!propertiesMap[propertyName]) {
          console.warn(`Unsupported expect property: ${propertyName}`);
          return;
        }

        const assertPropertyName =
          propertiesMap[propertyName][not ? 'not' : 'default'];
        const callExpressionPath = memberExpressionPathToReplace.parentPath;

        const argument0 = callExpressionPath.value.arguments[0];
        const argument1 = memberExpression.object.arguments[0];

        hasAssertions = true;
        callExpressionPath.value.callee = j.memberExpression(
          j.identifier('assert'),
          j.identifier(assertPropertyName),
        );
        callExpressionPath.value.arguments = [argument0, argument1];
      });

    if (hasAssertions) {
      root
        .find(j.ImportDeclaration, { source: { value: 'node:assert' } })
        .remove();
      if (
        (!root.find(j.ImportDeclaration),
        { source: { value: 'node:assert/strict' } })
      ) {
        prependImport(
          j,
          root,
          j.importDeclaration(
            [j.importDefaultSpecifier(j.identifier('assert'))],
            j.stringLiteral('node:assert/strict'),
          ),
        );
      }
    }
  }

  updateTopLevelMethods();
  updateAssertions();

  root
    .find(j.ImportDeclaration, { source: { value: '@jest/globals' } })
    .remove();

  return root.toSource(options);
};
