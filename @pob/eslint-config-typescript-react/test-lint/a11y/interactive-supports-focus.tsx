import type { ReactNode } from "react";

export const El: ReactNode = (
  // oxlint-disable-next-line jsx_a11y/interactive-supports-focus, jsx_a11y/click-events-have-key-events
  <span role="button" onClick={() => {}}>
    x
  </span>
);
