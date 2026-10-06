import { Component, type ReactNode } from "react";

export class C extends Component {
  // oxlint-disable-next-line react-js/no-arrow-function-lifecycle
  componentDidMount = (): void => {};
  render(): ReactNode {
    return <div />;
  }
}
