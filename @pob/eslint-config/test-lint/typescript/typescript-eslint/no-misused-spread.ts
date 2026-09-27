const promise = Promise.resolve();
// oxlint-disable-next-line typescript/no-misused-promises, typescript/no-misused-spread
export const spreadPromise = { ...promise };

function getObject(): Record<string, string> {
  return {};
}
// oxlint-disable-next-line typescript/no-misused-spread
export const getObjectSpread = { ...getObject };

declare const userName: string;
// oxlint-disable-next-line typescript/no-misused-spread
export const characters = [...userName];
