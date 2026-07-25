"use strict";

const cart = {};
const updateCart = () => {};

if (cart.items && cart.items[0] && cart.items[0].quantity === 0)
  // eslint-disable-next-line curly
  updateCart(cart);

const interpolation = "";

// eslint-disable-next-line no-unused-vars
const strings = [
  // eslint-disable-next-line quotes
  `could have been a regular string`,
  `
    multiple
    lines
    `,
  `uses ${interpolation}`,
  String.raw`\tagged/`,
];
