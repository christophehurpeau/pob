import { type ReactNode, createContext, useContext } from "react";

const ThemeContext = createContext("light");

export function Theme(): ReactNode {
  // oxlint-disable-next-line react-x/no-use-context
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}
