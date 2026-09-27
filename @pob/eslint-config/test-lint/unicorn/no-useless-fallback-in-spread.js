/* global foo */
// oxlint-disable-next-line unicorn/no-useless-fallback-in-spread
export const o = { ...(foo || {}) };
