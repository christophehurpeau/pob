const array = [1, 2, 3];

// ❌
// eslint-disable-next-line unicorn/no-array-reverse
export const reversed1 = [...array].reverse();

// ✅
export const reversed2 = [...array].toReversed();
