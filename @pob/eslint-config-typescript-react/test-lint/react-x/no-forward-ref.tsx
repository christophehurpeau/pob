import { forwardRef } from "react";

// oxlint-disable-next-line react-x/no-forward-ref, react/function-component-definition
export const Input = forwardRef<HTMLInputElement>((props, ref) => (
  <input ref={ref} />
));
