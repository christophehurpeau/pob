import { Fragment as Fragment2 } from "react";
import { Fragment } from "react/jsx-runtime";

export const fragment1 = (
  // oxlint-disable-next-line react/jsx-fragments -- oxlint checks <Fragment> by name, whatever its source
  <Fragment>
    <div />
    <div />
  </Fragment>
);

// not reported by oxlint: aliased Fragment
export const fragment2 = (
  <Fragment2>
    <div />
    <div />
  </Fragment2>
);
