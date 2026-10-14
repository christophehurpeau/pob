import { type ReactNode, createContext } from "react";

const ThemeContext = createContext("light");

export function Theme({ children }: { children: ReactNode }): ReactNode {
  // oxlint-disable-next-line react-x/no-context-provider
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;
}
