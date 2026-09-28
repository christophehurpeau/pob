import type { ReactNode } from "react";

export function Parent(): ReactNode {
  // oxlint-disable-next-line react/no-unstable-nested-components
  function Child(): ReactNode {
    return <div />;
  }
  return <Child />;
}
