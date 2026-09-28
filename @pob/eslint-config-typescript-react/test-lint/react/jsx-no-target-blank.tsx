/* oxlint-disable jsx_a11y/anchor-has-content */

export const Invalid = (
  // oxlint-disable-next-line react/jsx-no-target-blank
  <a target="_blank" href="http://example.com/" />
);

const dynamicLink = "http://example.com/";
// oxlint-disable-next-line react/jsx-no-target-blank
export const Valid = <a target="_blank" href={dynamicLink} />;
