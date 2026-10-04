import type { ReactNode } from "react";

export function Count({ count }: { count: number }): ReactNode {
  // oxlint-disable-next-line react-js/jsx-no-leaked-render
  return <div>{count && <span>{count}</span>}</div>;
}
