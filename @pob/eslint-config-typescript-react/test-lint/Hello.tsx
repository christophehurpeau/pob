import type { ReactNode } from "react";

export function Hello(props: { name: string }): ReactNode {
  return <div>Hello, {props.name}.</div>;
}
