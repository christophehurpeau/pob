declare function createReactClass(spec: { render: () => unknown }): unknown;

// oxlint-disable-next-line react-js/prefer-stateless-function, react-js/no-arrow-function-lifecycle, react/prefer-es6-class
export const C = createReactClass({ render: () => <div /> });
