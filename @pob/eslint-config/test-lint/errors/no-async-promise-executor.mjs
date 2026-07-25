const foo = Promise.resolve();

// eslint-disable-next-line no-async-promise-executor
export const result = new Promise(async (resolve, reject) => {
  resolve(await foo);
});
