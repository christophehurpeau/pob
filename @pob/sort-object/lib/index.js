'use strict';

module.exports = function sortObject(obj, keys = []) {
  const objCopy = { ...obj };
  const objKeys = Object.keys(obj);
  objKeys.forEach((key) => delete obj[key]);
  keys
    .filter((key) => Object.hasOwnProperty.call(objCopy, key))
    .concat(
      objKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    )
    .forEach((key) => {
      obj[key] = objCopy[key];
    });
  return obj;
};
