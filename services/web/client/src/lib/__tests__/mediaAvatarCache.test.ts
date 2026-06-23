import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMediaAvatarCacheForTests,
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

  it("failure: missing stored value returns missing source", async () => {
    const result = await resolveMediaAvatarUrl("character", "c1", "", "main");
    expect(result.source).toBe("missing");
    expect(result.url).toBeNull();
  });
});
