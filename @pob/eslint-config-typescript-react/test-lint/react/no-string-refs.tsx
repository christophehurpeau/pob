import type { ReactNode } from "react";

export function Hello(): ReactNode {
  // oxlint-disable-next-line react/no-string-refs
  return <div ref="hello">Hello, world.</div>;
}
