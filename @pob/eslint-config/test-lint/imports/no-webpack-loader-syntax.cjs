"use strict";

// eslint-disable-next-line import-x/no-webpack-loader-syntax, import-x/no-unresolved
const myModule = require("my-loader!./my-module");

exports.myModule = myModule;
