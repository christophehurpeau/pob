import { Component, type ReactNode } from "react";

// oxlint-disable-next-line react-x/no-class-component
export class C extends Component {
  handle(): boolean {
    // oxlint-disable-next-line react/no-is-mounted, typescript/no-unsafe-return, typescript/no-unsafe-call
    return this.isMounted();
  }
  render(): ReactNode {
    return <div />;
  }
}
