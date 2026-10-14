// oxlint-disable-next-line @pob/react-named-import
import * as React from "react";

// oxlint-disable-next-line @pob/react-named-import
export function Foo({ foo }: { foo?: string }): React.ReactNode {
  return <div>{foo}</div>;
}
