import { Fragment as Fragment2 } from "react";
import { Fragment } from "react/jsx-runtime";

export const fragment1 = (
  <Fragment>
    <div />
    <div />
  </Fragment>
);

export const fragment2 = (
  // eslint-disable-next-line react/jsx-fragments
  <Fragment2>
    <div />
    <div />
  </Fragment2>
);
