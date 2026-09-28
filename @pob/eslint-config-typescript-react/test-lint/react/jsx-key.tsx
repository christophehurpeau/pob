import type { ReactNode } from "react";
import { Hello } from "../Hello";

const items = ["a", "b"];
// oxlint-disable-next-line react/jsx-key
export const List: ReactNode[] = items.map((name) => <Hello name={name} />);
