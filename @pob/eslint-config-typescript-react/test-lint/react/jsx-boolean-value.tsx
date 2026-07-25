import type { ReactNode } from "react";

function Hello({ personal }: { personal: boolean }): ReactNode {
  return personal ? <div>Hello, World!</div> : <div>Hello, World!</div>;
}

// eslint-disable-next-line react/jsx-boolean-value
export const Incorrect = <Hello personal={true} />;

export const Valid = <Hello personal />;
