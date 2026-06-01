/**
 * Extracts a user-friendly message from an Axios error response.
 * Falls back to the provided fallback string if no message is found.
 */
export function extractApiError(err: unknown, fallback: string): string {
    return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}
