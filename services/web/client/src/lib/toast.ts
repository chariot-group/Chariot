import { toast } from "react-toastify";

type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (
  message: string,
  type: ToastType,
  options?: { autoClose?: number; toastId?: string },
) => {
  switch (type) {
    case "success":
      toast.success(message, options);
      break;
    case "error":
      toast.error(message, options);
      break;
    case "info":
      toast.info(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    default:
      toast(message, options);
      break;
  }
};
