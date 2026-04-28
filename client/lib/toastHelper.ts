import toast from 'react-hot-toast';

export const getErrorMessage = (err: any): string => {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((d: any) => (typeof d?.msg === "string" ? d.msg : null))
      .filter(Boolean);
    if (parts.length) return parts.join(", ");
  }

  if (detail && typeof detail === "object") {
    if (typeof detail?.msg === "string") return detail.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      // ignore JSON stringify errors and continue fallback
    }
  }

  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return "เกิดข้อผิดพลาดในการดำเนินงาน";
};

export const withToast = async <T>(
  promise: Promise<T>,
  options?: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((err: any) => string);
  }
): Promise<T> => {
  return toast.promise(promise, {
    loading: options?.loading || 'กำลังประมวลผล...',
    success: options?.success || 'ดำเนินการสำเร็จ',
    error: (err) => {
      if (options?.error) {
         if (typeof options.error === 'function') {
             return options.error(err);
         }
         return options.error;
      }
      return getErrorMessage(err);
    },
  });
};
