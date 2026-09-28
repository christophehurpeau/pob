declare function createReactClass(spec: { render: () => unknown }): unknown;

/* eslint-disable-next-line react/prefer-stateless-function, react/no-arrow-function-lifecycle */ // oxlint-disable-next-line react/prefer-es6-class
export const C = createReactClass({ render: () => <div /> });
