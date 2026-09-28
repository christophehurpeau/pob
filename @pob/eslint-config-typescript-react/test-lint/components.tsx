import { forwardRef, memo } from "react";
import type { ReactNode } from "react";

// oxlint-disable-next-line react/function-component-definition
export const InvalidFunctionComponent = (): ReactNode => null;

export function ValidFunctionComponent(): ReactNode {
  return null;
}

// oxlint-disable-next-line typescript/explicit-function-return-type, typescript/explicit-module-boundary-types
export function InvalidFunctionComponentWithInference() {
  return null;
}

interface FunctionComponentWithGenericProps<T extends string> {
  foo: T;
}

export function FunctionComponentWithGeneric<T extends string>({
  foo,
}: FunctionComponentWithGenericProps<T>): ReactNode {
  return foo;
}

interface ExampleProps {
  foo?: string;
}

export function getComponentAsAnonymousArrowFunction() {
  // oxlint-disable-next-line react/function-component-definition -- invalid anonymous arrow function
  return ({ foo = "Hello world" }: ExampleProps): ReactNode => {
    return <div>{foo}</div>;
  };
}

export function getComponentAsAnonymousFunctionExpression() {
  // oxlint-disable-next-line func-names -- invalid anonymous function expression
  return function ({ foo = "Hello world" }: ExampleProps): ReactNode {
    return <div>{foo}</div>;
  };
}

export function getComponentAsArrowFunctionExpression() {
  // oxlint-disable-next-line react/function-component-definition -- invalid anonymous expression function
  return ({ foo = "Hello world" }: ExampleProps): ReactNode => {
    return <div>{foo}</div>;
  };
}

// oxlint-disable-next-line react/function-component-definition -- also reported by oxlint in memo() and forwardRef()
memo(() => <div>foo</div>);

// oxlint-disable-next-line react/function-component-definition -- also reported by oxlint in memo() and forwardRef()
forwardRef<HTMLDivElement, ExampleProps>(() => <div>foo</div>);

// oxlint-disable-next-line react/function-component-definition -- also reported by oxlint in memo() and forwardRef()
forwardRef<HTMLDivElement>(({ foo }: ExampleProps, ref) => (
  <div ref={ref}>{foo}</div>
));

// TODO missing ref type
// oxlint-disable-next-line react/function-component-definition -- also reported by oxlint in memo() and forwardRef()
forwardRef(({ foo }: ExampleProps, ref) => (
  // @ts-expect-error -- this should not be the rule that catches this
  <div ref={ref}>{foo}</div>
));

// TODO missing ref usage
// oxlint-disable-next-line react/function-component-definition -- also reported by oxlint in memo() and forwardRef()
forwardRef<HTMLDivElement, ExampleProps>(({ foo }) => <div>{foo}</div>);
