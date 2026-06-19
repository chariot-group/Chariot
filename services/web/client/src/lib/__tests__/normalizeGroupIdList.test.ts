import { describe, expect, it } from 'vitest';
import { normalizeGroupIdList } from '@/lib/normalizeGroupIdList';

describe('normalizeGroupIdList', () => {
    it('returns string ids as-is', () => {
        expect(normalizeGroupIdList(['g1', 'g2'])).toEqual(['g1', 'g2']);
    });

    it('extracts _id from populated group objects', () => {
        expect(normalizeGroupIdList([{ _id: 'g1' }, { _id: 'g2', label: 'Old' }])).toEqual(['g1', 'g2']);
    });

    it('returns an empty array for invalid input', () => {
        expect(normalizeGroupIdList(undefined)).toEqual([]);
        expect(normalizeGroupIdList([null, {}, { label: 'no-id' }])).toEqual([]);
    });
});
