import type { ReactNode } from "react";

export const El: ReactNode = (
  // oxlint-disable-next-line react/no-danger-with-children
  <div dangerouslySetInnerHTML={{ __html: "x" }}>child</div>
);
