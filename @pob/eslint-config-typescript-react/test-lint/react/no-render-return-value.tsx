declare const ReactDOM: { render: (el: unknown, c: unknown) => unknown };

export function mount(c: HTMLElement): unknown {
  // oxlint-disable-next-line react-js/no-deprecated, react/no-render-return-value
  const result = ReactDOM.render(<div />, c);
  return result;
}
