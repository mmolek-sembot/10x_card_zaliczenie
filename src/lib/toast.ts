import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

export const showLoading = (message: string, promise: Promise<any>, options: {
  loading?: string;
  success?: string;
  error?: string;
}) => {
  return toast.promise(promise, {
    loading: options.loading || message,
    success: options.success || "Operacja zakończona pomyślnie",
    error: (err) => options.error || err?.message || "Wystąpił błąd"
  });
}; 