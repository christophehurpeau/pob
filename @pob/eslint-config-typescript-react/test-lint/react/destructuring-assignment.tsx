import type { ReactNode } from "react";

export function MyComponent(props: { id: string | undefined }): ReactNode {
  // eslint-disable-next-line react/destructuring-assignment
  return <div id={props.id} />;
}
