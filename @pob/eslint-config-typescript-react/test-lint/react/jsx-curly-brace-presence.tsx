import type { ReactNode } from "react";

export function TestJsxCurlyBracePresence(): ReactNode {
  return (
    <>
      {/* oxlint-disable-next-line react/jsx-curly-brace-presence */}
      <div>{"Hello 'world'"}</div>
      {/* oxlint-disable-next-line react/jsx-curly-brace-presence */}
      <div>{'Hello "world"'}</div>

      <div>Hello 'world'</div>
      <div>Hello "world"</div>

      <div>{">"}</div>
      <div>{"<"}</div>
      <div>{"}"}</div>
      <div>{"{"}</div>
    </>
  );
}
