import toast from "react-hot-toast";

/** Small wrapper so every message in the app looks the same. */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message || "Something went wrong. Please try again."),
  info: (message: string) => toast(message),
};
