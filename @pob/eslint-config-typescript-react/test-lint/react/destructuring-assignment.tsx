import type { ReactNode } from "react";

export function MyComponent(props: { id: string | undefined }): ReactNode {
  // oxlint-disable-next-line react-js/destructuring-assignment
  return <div id={props.id} />;
}
