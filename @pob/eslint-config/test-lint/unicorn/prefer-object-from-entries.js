/* global arr */
// eslint-disable-next-line unicorn/prefer-object-from-entries, unicorn/no-array-reduce
export const r = arr.reduce((o, [k, v]) => ({ ...o, [k]: v }), {});
