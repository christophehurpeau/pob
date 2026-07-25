export function foo(error, loading) {
  if (error) {
    return "It failed";
  } else if (loading) {
    return "It's still loading";
  }
}

export function foo2(error, loading) {
  if (error) {
    return "It failed";
  }

  if (loading) {
    return "It's still loading";
  }
}
