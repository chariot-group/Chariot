/**
 * Format API response
 */
export function formatResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
) {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error }),
  };
}

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};
