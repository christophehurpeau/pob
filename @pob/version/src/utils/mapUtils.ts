export function getMapArrayItemForKey<K, V>(map: Map<K, V[]>, key: K): V[] {
  let value: V[] | undefined = map.get(key);
  if (value === undefined) {
    map.set(key, (value = [] as V[]));
  }
  return value;
}
