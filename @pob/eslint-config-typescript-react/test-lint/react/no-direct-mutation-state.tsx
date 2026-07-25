import { Component, type ReactNode } from "react";

export class C extends Component {
  handle(): void {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state = { x: 1 };
  }
  render(): ReactNode {
    return <div />;
  }
}
