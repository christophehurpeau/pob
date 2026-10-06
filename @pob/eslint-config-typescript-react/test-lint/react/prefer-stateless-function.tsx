// oxlint-disable-next-line @pob/react-named-import
import * as React from "react";

interface FooProps {
  foo?: string;
}

// oxlint-disable-next-line react-js/prefer-stateless-function, @pob/react-named-import
export class Foo extends React.Component<FooProps> {
  // oxlint-disable-next-line @pob/react-named-import
  render(): React.ReactNode {
    const { foo } = this.props;

    if (!foo) {
      return null;
    }

    return <div>{foo}</div>;
  }
}
