"use strict";

const cart = {};
const updateCart = () => {};

// https://github.com/prettier/eslint-config-prettier#curly
if (cart.items && cart.items[0] && cart.items[0].quantity === 0)
  // eslint-disable-next-line curly
  updateCart(cart);
