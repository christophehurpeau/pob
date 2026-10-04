import type { ReactNode } from "react";

export function Count({ count }: { count: number }): ReactNode {
  // eslint-disable-next-line react/jsx-no-leaked-render
  return <div>{count && <span>{count}</span>}</div>;
}
