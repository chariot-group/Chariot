/** Normalise un identifiant personnage (Mongo ObjectId, string, etc.) pour comparaisons roster / liaisons. */
export function normalizeCharacterId(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "object") {
    const withHex = value as { toHexString?: () => string; $oid?: string; _id?: unknown };
    if (typeof withHex.toHexString === "function") {
      const hex = withHex.toHexString().trim();
      return hex.length > 0 ? hex : null;
    }
    if (typeof withHex.$oid === "string") {
      const oid = withHex.$oid.trim();
      return oid.length > 0 ? oid : null;
    }
    if (withHex._id != null) {
      return normalizeCharacterId(withHex._id);
    }
  }
  const asString = String(value).trim();
  return asString.length > 0 ? asString : null;
}
