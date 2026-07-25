import type { ReactNode } from "react";

interface Props {
  foo: string;
  bar?: string;
}

export function MyStatelessComponent({
  // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- sometimes we want to keep this as safety
  foo = "default",
  bar,
}: Props): ReactNode {
  return (
    <div>
      Hello {foo} {bar}
    </div>
  );
}
