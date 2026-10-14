import { Component, type ReactNode } from "react";

// error boundaries are still classes
export class ErrorBoundary extends Component<{ children: ReactNode }> {
  static getDerivedStateFromError(): object {
    return {};
  }

  // oxlint-disable-next-line react-x/no-component-will-mount
  componentWillMount(): void {}

  // oxlint-disable-next-line react-x/no-component-will-receive-props
  componentWillReceiveProps(): void {}

  // oxlint-disable-next-line react-x/no-component-will-update
  componentWillUpdate(): void {}

  render(): ReactNode {
    return this.props.children;
  }
}
