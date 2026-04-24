import toast from 'react-hot-toast';

export const withToast = async <T>(
  promise: Promise<T>,
  options?: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((err: any) => string);
  }
): Promise<T> => {
  return toast.promise(promise, {
    loading: options?.loading || 'Processing...',
    success: options?.success || 'Success',
    error: (err) => {
      if (options?.error) {
         if (typeof options.error === 'function') {
             return options.error(err);
         }
         return options.error;
      }
      return err?.response?.data?.detail || err?.message || 'An error occurred';
    },
  });
};
