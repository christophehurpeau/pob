import type { ReactNode } from "react";

function Hello({
  lastName,
  firstName,
}: {
  lastName: string;
  firstName?: string;
}): ReactNode {
  return null;
}

// eslint-disable-next-line react/jsx-no-duplicate-props
export const helloWithDuplicate = <Hello lastName="Smith" lastName="John" />;
