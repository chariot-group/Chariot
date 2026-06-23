import {
  characterAvatarMainKey,
  characterAvatarThumbKey,
  isExternalMediaUrl,
  isMediaObjectKey,
  presignedCacheKey,
  resolveMediaObjectKey,
  resolveLegacyAvatarKeysToDelete,
  userAvatarMainKey,
} from '@/resources/media/media.utils';

describe('media.utils', () => {
  describe('isExternalMediaUrl', () => {
    it('nominal: detects http and https URLs', () => {
      expect(isExternalMediaUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=abc')).toBe(true);
      expect(isExternalMediaUrl('http://example.test/a.png')).toBe(true);
    });

    it('edge: object keys are not external URLs', () => {
      expect(isExternalMediaUrl('avatars/characters/abc/main.webp')).toBe(false);
    });
  });

  describe('isMediaObjectKey', () => {
    it('nominal: accepts avatars/ prefix keys', () => {
      expect(isMediaObjectKey('avatars/users/u1/main.webp')).toBe(true);
    });

    it('failure: rejects external URLs', () => {
      expect(isMediaObjectKey('https://example.test/a.webp')).toBe(false);
    });
  });

  describe('resolveMediaObjectKey', () => {
    it('nominal: derives thumb from main key', () => {
      expect(
        resolveMediaObjectKey(
          'avatars/characters/id1/main.webp',
          'thumb',
          'character',
          'id1',
        ),
      ).toBe('avatars/characters/id1/thumb.webp');
    });

    it('edge: external URL returns null for MinIO resolution', () => {
      expect(
        resolveMediaObjectKey(
          'https://example.test/a.png',
          'main',
          'character',
          'id1',
        ),
      ).toBeNull();
    });

    it('edge: empty value returns null', () => {
      expect(resolveMediaObjectKey('', 'main', 'character', 'id1')).toBeNull();
    });
  });

  describe('object key builders', () => {
    it('nominal: builds stable character and user keys', () => {
      expect(characterAvatarMainKey('abc')).toBe('avatars/characters/abc/main.webp');
      expect(characterAvatarThumbKey('abc')).toBe('avatars/characters/abc/thumb.webp');
      expect(userAvatarMainKey('user-1')).toBe('avatars/users/user-1/main.webp');
    });
  });

  describe('presignedCacheKey', () => {
    it('nominal: unique key per scope entity variant', () => {
      expect(presignedCacheKey('character', 'x', 'thumb')).toBe('character:x:thumb');
    });
  });

  describe('resolveLegacyAvatarKeysToDelete', () => {
    it('nominal: skips canonical keys (replaced via putObject)', () => {
      const main = characterAvatarMainKey('abc');
      const thumb = characterAvatarThumbKey('abc');
      expect(resolveLegacyAvatarKeysToDelete(main, main, thumb)).toEqual([]);
    });

    it('nominal: deletes legacy paths before canonical upload', () => {
      const main = characterAvatarMainKey('abc');
      const thumb = characterAvatarThumbKey('abc');
      expect(
        resolveLegacyAvatarKeysToDelete(
          'avatars/characters/abc/v2/main.webp',
          main,
          thumb,
        ),
      ).toEqual([
        'avatars/characters/abc/v2/main.webp',
        'avatars/characters/abc/v2/thumb.webp',
      ]);
    });

    it('edge: external URLs are not deleted from MinIO', () => {
      expect(
        resolveLegacyAvatarKeysToDelete(
          'https://api.dicebear.com/7.x/avataaars/svg?seed=abc',
          characterAvatarMainKey('abc'),
          characterAvatarThumbKey('abc'),
        ),
      ).toEqual([]);
    });
  });
});
