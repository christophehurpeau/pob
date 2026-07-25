import { type ReactNode, createContext } from "react";

const Ctx = createContext({ a: 0 });

export function Provider(): ReactNode {
  // eslint-disable-next-line react/jsx-no-constructed-context-values
  return <Ctx.Provider value={{ a: 1 }} />;
}
