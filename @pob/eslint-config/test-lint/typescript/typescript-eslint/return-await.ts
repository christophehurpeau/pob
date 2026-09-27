export async function invalidInTryCatch1(): Promise<void> {
  try {
    /* eslint-disable-next-line unicorn/no-useless-promise-resolve-reject */ // oxlint-disable-next-line typescript/return-await, typescript/prefer-promise-reject-errors
    return Promise.reject("try");
  } catch {
    // Doesn't execute due to missing await.
  }
}
