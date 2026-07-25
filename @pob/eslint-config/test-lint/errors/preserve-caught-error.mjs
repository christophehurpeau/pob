export function f() {
  try {
    JSON.parse("x");
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error
    throw new Error(`failed: ${error.message}`);
  }
}
