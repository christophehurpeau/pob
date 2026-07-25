import { useEffect } from "react";

export function useHook(name: string): void {
  if (name !== "") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      localStorage.setItem("formData", name);
    });
  }
}
