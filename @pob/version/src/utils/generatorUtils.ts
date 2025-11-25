export async function asyncIterableToArray<T>(
  asyncIterable: AsyncIterable<T>,
): Promise<T[]> {
  const result: T[] = [];

  for await (const value of asyncIterable) {
    result.push(value);
  }

  return result;
}
