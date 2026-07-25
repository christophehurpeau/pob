export async function invalidInTryCatch1(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/return-await, unicorn/no-useless-promise-resolve-reject, @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject("try");
  } catch {
    // Doesn't execute due to missing await.
  }
}
