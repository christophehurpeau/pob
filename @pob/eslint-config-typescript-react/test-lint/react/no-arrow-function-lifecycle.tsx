import { Component, type ReactNode } from "react";

export class C extends Component {
  // eslint-disable-next-line react/no-arrow-function-lifecycle
  componentDidMount = (): void => {};
  render(): ReactNode {
    return <div />;
  }
}
