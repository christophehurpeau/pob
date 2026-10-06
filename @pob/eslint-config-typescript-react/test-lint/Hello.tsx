import type { ReactNode } from "react";

export function Hello(props: { name: string }): ReactNode {
  // oxlint-disable-next-line react-js/destructuring-assignment
  return <div>Hello, {props.name}.</div>;
}
