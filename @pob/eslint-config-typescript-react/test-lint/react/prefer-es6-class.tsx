declare function createReactClass(spec: { render: () => unknown }): unknown;

// eslint-disable-next-line react/prefer-es6-class, react/prefer-stateless-function, react/no-arrow-function-lifecycle
export const C = createReactClass({ render: () => <div /> });
