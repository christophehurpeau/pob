export function doSomething(condition) {
  if (condition) {
    return true;
  } else {
    // eslint-disable-next-line no-useless-return
    return;
  }
}

export function doSomethingElse(condition) {
  if (condition) {
    return true;
  }
}
