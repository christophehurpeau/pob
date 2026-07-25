import { useEffect } from "react";

export function useHook(name: string): void {
  useEffect(() => {
    localStorage.setItem("formData", name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
