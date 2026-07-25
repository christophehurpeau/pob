import type { ReactNode } from "react";

declare const PropTypes: { string: unknown; func: unknown };

export function C(): ReactNode {
  return <div />;
}
// eslint-disable-next-line react/sort-prop-types
C.propTypes = { onClick: PropTypes.func, a: PropTypes.string };
