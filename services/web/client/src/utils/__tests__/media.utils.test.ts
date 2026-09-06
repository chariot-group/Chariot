import { describe, expect, it } from "vitest";
import {
  hasMediaAvatar,
  isAcceptedMediaAvatarFile,
  isExternalMediaUrl,
  MEDIA_AVATAR_ACCEPT_MIME,
  MEDIA_AVATAR_MAX_UPLOAD_MB,
  MEDIA_AVATAR_SIZE_CLASS,
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

  it("nominal: sheet and profile sizes keep a 4:5 aspect ratio", () => {
    expect(MEDIA_AVATAR_SIZE_CLASS.sheet).toContain("aspect-[4/5]");
    expect(MEDIA_AVATAR_SIZE_CLASS.profile).toContain("aspect-[4/5]");
    expect(MEDIA_AVATAR_SIZE_CLASS.thumb).toContain("aspect-square");
  });

  /** @see FR-media-avatar-format */
  describe("FR-media-avatar-format — upload accept gate", () => {
    it("nominal: accepts jpeg/png/webp by mime type", () => {
      expect(isAcceptedMediaAvatarFile({ name: "a.bin", type: "image/jpeg" })).toBe(true);
      expect(isAcceptedMediaAvatarFile({ name: "a.bin", type: "image/png" })).toBe(true);
      expect(isAcceptedMediaAvatarFile({ name: "a.bin", type: "image/webp" })).toBe(true);
    });

    it("edge: accepts by extension when mime is empty (e.g. HEIC)", () => {
      expect(isAcceptedMediaAvatarFile({ name: "photo.HEIC", type: "" })).toBe(true);
      expect(isAcceptedMediaAvatarFile({ name: "photo.heif", type: "" })).toBe(true);
    });

    it("failure: rejects unsupported mime and extension", () => {
      expect(isAcceptedMediaAvatarFile({ name: "doc.pdf", type: "application/pdf" })).toBe(false);
      expect(isAcceptedMediaAvatarFile({ name: "anim.gif", type: "image/gif" })).toBe(false);
    });

    it("nominal: file picker accept lists supported mime and extensions", () => {
      expect(MEDIA_AVATAR_ACCEPT_MIME).toContain("image/jpeg");
      expect(MEDIA_AVATAR_ACCEPT_MIME).toContain(".heic");
      expect(MEDIA_AVATAR_ACCEPT_MIME).not.toContain("image/gif");
      expect(MEDIA_AVATAR_MAX_UPLOAD_MB).toBe(5);
    });
  });
});
