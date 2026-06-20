export function normalizeGroupIdList(items: unknown[] | undefined): string[] {
    if (!items || !Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null && '_id' in item) {
                return (item as { _id?: string })._id;
            }
            return undefined;
        })
        .filter((id: string | undefined): id is string => Boolean(id));
}
