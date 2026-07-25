/* Invalid cases */

// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
await Promise.reject("something bad happened");

// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
await Promise.reject(5);

// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
await Promise.reject();

await new Promise((resolve, reject) => {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  reject("something bad happened");
});

await new Promise((resolve, reject) => {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  reject();
});

/* Valid cases */

await Promise.reject(new Error("something bad happened"));
