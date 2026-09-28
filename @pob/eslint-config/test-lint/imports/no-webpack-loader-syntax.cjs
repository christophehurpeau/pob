"use strict";

/* eslint-disable-next-line import-x/no-unresolved */ // oxlint-disable-next-line import/no-webpack-loader-syntax
const myModule = require("my-loader!./my-module");

exports.myModule = myModule;
