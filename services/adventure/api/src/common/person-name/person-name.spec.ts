import {
  cleanPersonName,
  isValidPersonName,
  normalizePersonName,
} from '@/common/person-name/person-name';

describe('FR-user-profile-keycloak — person name rules', () => {
  describe('normalizePersonName', () => {
    it.each([
      ["JEAN-pierre o'NEIL", "Jean-Pierre O'Neil"],
      ['  Élise   Dupont ', 'Élise Dupont'],
      ['JEAN DUPONT', 'Jean Dupont'],
      ['o’brien', "O'Brien"],
      ['élodie', 'Élodie'],
    ])('normalizes %p to %p', (input, expected) => {
      expect(normalizePersonName(input)).toBe(expected);
    });

    it('is idempotent', () => {
      const once = normalizePersonName("JEAN-pierre o'NEIL");
      expect(normalizePersonName(once)).toBe(once);
    });

    it('returns an invalid value cleaned, without altering digits', () => {
      expect(normalizePersonName('  jean2  ')).toBe('Jean2');
    });
  });

  describe('cleanPersonName', () => {
    it('applies NFC and replaces typographic apostrophes', () => {
      expect(cleanPersonName('Amélie')).toBe('Amélie');
      expect(cleanPersonName('D’Arc')).toBe("D'Arc");
    });
  });

  describe('isValidPersonName', () => {
    it.each([
      'Jean',
      'Élise',
      'Jean-Pierre',
      "O'Neil",
      'de la Fontaine',
      'Zoé',
      '李雷',
      'Jo',
      'J',
      'Li',
    ])('accepts %p', (value) => expect(isValidPersonName(value)).toBe(true));

    it('accepts 50 characters and rejects 51', () => {
      expect(isValidPersonName('a'.repeat(50))).toBe(true);
      expect(isValidPersonName('a'.repeat(51))).toBe(false);
    });

    it('measures length after cleanup', () => {
      expect(isValidPersonName(`  ${'a'.repeat(50)}  `)).toBe(true);
    });

    it.each([
      'Jean2',
      'J@ne',
      '',
      '   ',
      'Jean--Pierre',
      '-Jean',
      'Jean-',
      "Jean'",
      'Jean  ',
      'Jean_Pierre',
      '<script>',
    ])('rejects %p', (value) => {
      // 'Jean  ' becomes 'Jean' once cleaned, so it is the only valid one
      expect(isValidPersonName(value)).toBe(value === 'Jean  ');
    });

    it('rejects non-string values', () => {
      expect(isValidPersonName(undefined)).toBe(false);
      expect(isValidPersonName(42)).toBe(false);
    });
  });
});
