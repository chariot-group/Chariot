export function buildReferralsParams(page: number, limit: number, search: string): Record<string, unknown> {
    const params: Record<string, unknown> = { page, limit };

    if (search.trim()) {
        params.search = search.trim();
    }

    return params;
}
