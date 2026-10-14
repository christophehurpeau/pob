"use strict";

const cart = {};
const updateCart = () => {};

if (cart.items && cart.items[0] && cart.items[0].quantity === 0)
  // oxlint-disable-next-line curly
  updateCart(cart);

const interpolation = "";

// oxlint-disable-next-line no-unused-vars
const strings = [
  // oxlint-disable-next-line @pob/no-useless-template-literal
  `could have been a regular string`,
  `
    multiple
    lines
    `,
  `uses ${interpolation}`,
  String.raw`\tagged/`,
];
