declare const o: { a: string | null };
// oxlint-disable-next-line typescript/no-non-null-asserted-nullish-coalescing
export const y = o.a! ?? "x";
