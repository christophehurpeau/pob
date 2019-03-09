'use strict';

const { types: t } = require('@babel/core');

module.exports = {
  extends: () =>
    t.memberExpression(t.identifier('Object'), t.identifier('assign')),
  // get: () => t.memberExpression(t.identifier('Reflect'), t.identifier('get')),
  getPrototypeOf: () =>
    t.memberExpression(t.identifier('Object'), t.identifier('getPrototypeOf')),
  // set: () => t.memberExpression(t.identifier('Reflect'), t.identifier('set')),
  setPrototypeOf: () =>
    t.memberExpression(t.identifier('Object'), t.identifier('setPrototypeOf')),
};
