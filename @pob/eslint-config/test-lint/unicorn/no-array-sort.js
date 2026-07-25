const array = [1, 2, 3];

// ❌
// eslint-disable-next-line unicorn/no-array-sort
export const sorted1 = [...array].sort();

// ✅
export const sorted2 = [...array].toSorted();
