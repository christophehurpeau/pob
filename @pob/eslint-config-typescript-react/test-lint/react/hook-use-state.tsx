import { type ReactNode, useState } from "react";

export function Counter(): ReactNode {
  // eslint-disable-next-line react/hook-use-state
  const [count, changeCount] = useState(0);
  return (
    <button type="button" onClick={() => changeCount(count + 1)}>
      {count}
    </button>
  );
}
