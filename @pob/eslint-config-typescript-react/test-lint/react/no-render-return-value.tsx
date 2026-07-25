declare const ReactDOM: { render: (el: unknown, c: unknown) => unknown };

export function mount(c: HTMLElement): unknown {
  // eslint-disable-next-line react/no-render-return-value, react/no-deprecated
  const result = ReactDOM.render(<div />, c);
  return result;
}
