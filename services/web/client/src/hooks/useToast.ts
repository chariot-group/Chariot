import { useMemo } from "react";
import { showToast } from "@/lib/toast";

export const useToast = () => {
  return useMemo(
    () => ({
      success: (message: string) => showToast(message, "success"),
      error: (message: string) => showToast(message, "error"),
      info: (message: string) => showToast(message, "info"),
      warning: (message: string) => showToast(message, "warning"),
    }),
    [],
  );
};
