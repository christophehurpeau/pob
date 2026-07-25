// eslint-disable-next-line @pob/react-named-import
import * as React from "react";

interface FooProps {
  foo?: string;
}

// eslint-disable-next-line react/prefer-stateless-function, @pob/react-named-import
export class Foo extends React.Component<FooProps> {
  // eslint-disable-next-line @pob/react-named-import
  render(): React.ReactNode {
    const { foo } = this.props;

    if (!foo) {
      return null;
    }

    return <div>{foo}</div>;
  }
}
