export function f() {
  try {
    JSON.parse("x");
  } catch (error) {
    // oxlint-disable-next-line preserve-caught-error
    throw new Error(`failed: ${error.message}`);
  }
}
