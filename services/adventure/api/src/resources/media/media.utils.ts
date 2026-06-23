const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

export function isExternalMediaUrl(
  value: string | null | undefined,
): boolean {
  return typeof value === 'string' && EXTERNAL_URL_PATTERN.test(value.trim());
}

export function isMediaObjectKey(
  value: string | null | undefined,
): boolean {
  return (
    typeof value === 'string' &&
    value.trim().startsWith('avatars/') &&
    !isExternalMediaUrl(value)
  );
}

export function characterAvatarMainKey(characterId: string): string {
  return `avatars/characters/${characterId}/main.webp`;
}

export function characterAvatarThumbKey(characterId: string): string {
  return `avatars/characters/${characterId}/thumb.webp`;
}

/**
 * MinIO keys to delete before replacing an avatar at canonical paths.
 * Canonical main/thumb are overwritten via putObject — only legacy paths are removed.
 */
export function resolveLegacyAvatarKeysToDelete(
  storedValue: string | null | undefined,
  canonicalMain: string,
  canonicalThumb: string,
): string[] {
  if (!storedValue?.trim() || isExternalMediaUrl(storedValue)) {
    return [];
  }

  const trimmed = storedValue.trim();
  if (trimmed === canonicalMain) {
    return [];
  }

  const keys = new Set<string>();
  if (trimmed !== canonicalMain && trimmed !== canonicalThumb) {
    keys.add(trimmed);
  }

  const derivedThumb = trimmed.replace(/\/main\.webp$/, '/thumb.webp');
  if (
    derivedThumb !== trimmed &&
    derivedThumb !== canonicalMain &&
    derivedThumb !== canonicalThumb
  ) {
    keys.add(derivedThumb);
  }

  return [...keys];
}

export function userAvatarMainKey(keycloakId: string): string {
  return `avatars/users/${keycloakId}/main.webp`;
}

export function userAvatarThumbKey(keycloakId: string): string {
  return `avatars/users/${keycloakId}/thumb.webp`;
}

export function resolveMediaObjectKey(
  storedValue: string | null | undefined,
  variant: 'main' | 'thumb',
  scope: 'character' | 'user',
  entityId: string,
): string | null {
  if (!storedValue?.trim()) {
    return null;
  }

  const trimmed = storedValue.trim();

  if (isExternalMediaUrl(trimmed)) {
    return null;
  }

  if (trimmed.startsWith('avatars/')) {
    const base = trimmed.replace(/\/(main|thumb)\.webp$/, '');
    return `${base}/${variant}.webp`;
  }

  if (scope === 'character') {
    return variant === 'main'
      ? characterAvatarMainKey(entityId)
      : characterAvatarThumbKey(entityId);
  }

  return variant === 'main'
    ? userAvatarMainKey(entityId)
    : userAvatarThumbKey(entityId);
}

export function presignedCacheKey(
  scope: 'character' | 'user',
  entityId: string,
  variant: 'main' | 'thumb',
): string {
  return `${scope}:${entityId}:${variant}`;
}
