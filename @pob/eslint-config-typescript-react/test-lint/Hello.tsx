import type { ReactNode } from "react";

export function Hello(props: { name: string }): ReactNode {
  // eslint-disable-next-line react/destructuring-assignment
  return <div>Hello, {props.name}.</div>;
}
