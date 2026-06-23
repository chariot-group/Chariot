import { describe, expect, it } from "vitest";
import {
  hasMediaAvatar,
  isExternalMediaUrl,
  mediaAvatarCacheKey,
  pickAvatarVariant,
  shouldRefreshPresignedUrl,
} from "@/utils/media.utils";

describe("media.utils (client)", () => {
  it("nominal: detects external avatar URLs", () => {
    expect(isExternalMediaUrl("https://cdn.example/avatar.png")).toBe(true);
  });

  it("edge: empty value is not an avatar", () => {
    expect(hasMediaAvatar("")).toBe(false);
    expect(hasMediaAvatar("avatars/x/main.webp")).toBe(true);
  });

  it("nominal: pickAvatarVariant maps sizes", () => {
    expect(pickAvatarVariant("thumb")).toBe("thumb");
    expect(pickAvatarVariant("sheet")).toBe("main");
  });

  it("nominal: cache keys are stable", () => {
    expect(mediaAvatarCacheKey("character", "abc", "thumb")).toBe("character:abc:thumb");
  });

  it("edge: shouldRefreshPresignedUrl near expiry", () => {
    const soon = new Date(Date.now() + 60_000).toISOString();
    expect(shouldRefreshPresignedUrl(soon)).toBe(true);
    const later = new Date(Date.now() + 60 * 60_000).toISOString();
    expect(shouldRefreshPresignedUrl(later)).toBe(false);
  });
});
