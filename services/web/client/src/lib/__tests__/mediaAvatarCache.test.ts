import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMediaAvatarCacheForTests,
  peekCachedMediaAvatarUrl,
  resolveMediaAvatarUrl,
  resolveMediaAvatarUrlsBatch,
} from "@/lib/mediaAvatarCache";
import MediaService from "@/services/MediaService";

vi.mock("@/services/MediaService", () => ({
  default: {
    resolvePresignedReads: vi.fn(),
  },
}));

describe("mediaAvatarCache", () => {
  beforeEach(() => {
    clearMediaAvatarCacheForTests();
    vi.mocked(MediaService.resolvePresignedReads).mockReset();
  });

  it("nominal: returns external URL without API call", async () => {
    const result = await resolveMediaAvatarUrl(
      "character",
      "char-1",
      "https://example.test/a.png",
      "main",
    );

    expect(result.source).toBe("external");
    expect(result.url).toBe("https://example.test/a.png");
    expect(MediaService.resolvePresignedReads).not.toHaveBeenCalled();
  });

  it("nominal: batch resolves presigned URLs", async () => {
    vi.mocked(MediaService.resolvePresignedReads).mockResolvedValue({
      "character:c1:thumb": {
        url: "https://minio.test/signed",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        source: "presigned",
      },
    });

    const map = await resolveMediaAvatarUrlsBatch([
      {
        scope: "character",
        entityId: "c1",
        storedValue: "avatars/characters/c1/main.webp",
        variant: "thumb",
      },
    ]);

    expect(map.get("character:c1:thumb")?.url).toBe("https://minio.test/signed");
  });

  it("nominal: coalesces concurrent single fetches into one API call", async () => {
    vi.mocked(MediaService.resolvePresignedReads).mockResolvedValue({
      "character:c1:thumb": {
        url: "https://minio.test/c1-thumb",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        source: "presigned",
      },
      "character:c2:thumb": {
        url: "https://minio.test/c2-thumb",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        source: "presigned",
      },
    });

    const [r1, r2] = await Promise.all([
      resolveMediaAvatarUrl("character", "c1", "avatars/characters/c1/main.webp", "thumb"),
      resolveMediaAvatarUrl("character", "c2", "avatars/characters/c2/main.webp", "thumb"),
    ]);

    expect(r1.url).toBe("https://minio.test/c1-thumb");
    expect(r2.url).toBe("https://minio.test/c2-thumb");
    expect(MediaService.resolvePresignedReads).toHaveBeenCalledTimes(1);
    expect(MediaService.resolvePresignedReads).toHaveBeenCalledWith(
      expect.arrayContaining([
        { scope: "character", id: "c1", variant: "thumb" },
        { scope: "character", id: "c2", variant: "thumb" },
      ]),
      undefined,
    );
  });

  it("nominal: peekCachedMediaAvatarUrl reads warm cache without network", async () => {
    vi.mocked(MediaService.resolvePresignedReads).mockResolvedValue({
      "character:c1:thumb": {
        url: "https://minio.test/cached",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        source: "presigned",
      },
    });

    await resolveMediaAvatarUrl("character", "c1", "avatars/characters/c1/main.webp", "thumb");

    expect(
      peekCachedMediaAvatarUrl("character", "c1", "avatars/characters/c1/main.webp", "thumb"),
    ).toBe("https://minio.test/cached");
    expect(MediaService.resolvePresignedReads).toHaveBeenCalledTimes(1);
  });

  it("failure: missing stored value returns missing source", async () => {
    const result = await resolveMediaAvatarUrl("character", "c1", "", "main");
    expect(result.source).toBe("missing");
    expect(result.url).toBeNull();
  });
});
