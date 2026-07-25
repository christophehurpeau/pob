/* prettier-ignore */
/* eslint-disable no-undef */

// eslint-disable-next-line no-unsafe-negation
if (!key in object) {
  // operator precedence makes it equivalent to (!key) in object
  // and type conversion makes it equivalent to (key ? "false" : "true") in object
}
