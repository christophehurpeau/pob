declare function createReactClass(spec: { render: () => unknown }): unknown;

// oxlint-disable-next-line react/prefer-es6-class
export const C = createReactClass({ render: () => <div /> });
