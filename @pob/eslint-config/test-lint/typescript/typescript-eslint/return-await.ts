export async function invalidInTryCatch1(): Promise<void> {
  try {
    // oxlint-disable-next-line typescript/return-await, typescript/prefer-promise-reject-errors, unicorn/no-useless-promise-resolve-reject
    return Promise.reject("try");
  } catch {
    // Doesn't execute due to missing await.
  }
}
