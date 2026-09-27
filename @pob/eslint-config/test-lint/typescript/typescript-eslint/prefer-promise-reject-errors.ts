/* Invalid cases */

// oxlint-disable-next-line typescript/prefer-promise-reject-errors
await Promise.reject("something bad happened");

// oxlint-disable-next-line typescript/prefer-promise-reject-errors
await Promise.reject(5);

// oxlint-disable-next-line typescript/prefer-promise-reject-errors
await Promise.reject();

await new Promise((resolve, reject) => {
  // oxlint-disable-next-line typescript/prefer-promise-reject-errors
  reject("something bad happened");
});

await new Promise((resolve, reject) => {
  // oxlint-disable-next-line typescript/prefer-promise-reject-errors
  reject();
});

/* Valid cases */

await Promise.reject(new Error("something bad happened"));
