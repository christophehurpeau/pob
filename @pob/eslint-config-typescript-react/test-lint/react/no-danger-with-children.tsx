import type { ReactNode } from "react";

export const El: ReactNode = (
  // eslint-disable-next-line react/no-danger-with-children
  <div dangerouslySetInnerHTML={{ __html: "x" }}>child</div>
);
