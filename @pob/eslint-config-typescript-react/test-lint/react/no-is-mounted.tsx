import { Component, type ReactNode } from "react";

export class C extends Component {
  handle(): boolean {
    // eslint-disable-next-line react/no-is-mounted, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.isMounted();
  }
  render(): ReactNode {
    return <div />;
  }
}
