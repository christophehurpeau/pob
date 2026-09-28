import { useEffect } from "react";

export function useHook(name: string): void {
  useEffect(() => {
    localStorage.setItem("formData", name);
    // oxlint-disable-next-line react/exhaustive-deps
  }, []);
}
