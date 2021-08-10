'use strict';

module.exports = function sortObject(obj, keys = []) {
  if (typeof obj !== 'object') throw new Error('Invalid object passed');
  const objCopy = { ...obj };
  const objKeys = Object.keys(obj);
  objKeys.forEach((key) => delete obj[key]);
  [
    ...keys.filter((key) => Object.hasOwnProperty.call(objCopy, key)),
    ...objKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  ].forEach((key) => {
    obj[key] = objCopy[key];
  });
  return obj;
};
