export function f(obj) {
  // eslint-disable-next-line prefer-object-has-own
  return Object.prototype.hasOwnProperty.call(obj, "a");
}
