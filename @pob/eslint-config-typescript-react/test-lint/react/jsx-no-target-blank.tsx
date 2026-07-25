/* eslint-disable jsx-a11y/anchor-has-content */

export const Invalid = (
  // eslint-disable-next-line react/jsx-no-target-blank
  <a target="_blank" href="http://example.com/" />
);

const dynamicLink = "http://example.com/";
// eslint-disable-next-line react/jsx-no-target-blank
export const Valid = <a target="_blank" href={dynamicLink} />;
