import { useEffect } from "react";

export function useHook(name: string): void {
  if (name !== "") {
    // oxlint-disable-next-line react/rules-of-hooks
    useEffect(() => {
      localStorage.setItem("formData", name);
    });
  }
}
