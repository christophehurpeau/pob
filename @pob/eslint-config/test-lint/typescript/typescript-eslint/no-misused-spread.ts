const promise = Promise.resolve();
// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-misused-spread
export const spreadPromise = { ...promise };

function getObject(): Record<string, string> {
  return {};
}
// eslint-disable-next-line @typescript-eslint/no-misused-spread
export const getObjectSpread = { ...getObject };

declare const userName: string;
// eslint-disable-next-line @typescript-eslint/no-misused-spread
export const characters = [...userName];
