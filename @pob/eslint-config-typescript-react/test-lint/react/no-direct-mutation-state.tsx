import { Component, type ReactNode } from "react";

// oxlint-disable-next-line react-x/no-class-component
export class C extends Component {
  handle(): void {
    // oxlint-disable-next-line react/no-direct-mutation-state
    this.state = { x: 1 };
  }
  render(): ReactNode {
    return <div />;
  }
}
