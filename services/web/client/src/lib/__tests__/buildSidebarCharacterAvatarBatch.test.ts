import { describe, expect, it, vi } from "vitest";
import {
  buildSidebarCharacterAvatarBatchItems,
  SIDEBAR_CHARACTER_AVATAR_SIZE,
  sidebarCharacterAvatarImageUrl,
} from "@/lib/buildSidebarCharacterAvatarBatch";

/** @see FR-sidebar-character-avatars */
describe("FR-sidebar-character-avatars — batch builder", () => {
  it("nominal: builds xs character batch items with deduplication", () => {
    const items = buildSidebarCharacterAvatarBatchItems([
      { _id: "a", avatar: "key-a" },
      { _id: "a", avatar: "key-a-dup" },
      { _id: "b", avatar: "  " },
      { _id: "c", avatar: "key-c" },
    ]);

    expect(items).toEqual([
      { scope: "character", entityId: "a", storedValue: "key-a", size: SIDEBAR_CHARACTER_AVATAR_SIZE },
      { scope: "character", entityId: "c", storedValue: "key-c", size: SIDEBAR_CHARACTER_AVATAR_SIZE },
    ]);
  });

  it("edge: sidebarCharacterAvatarImageUrl skips empty stored values", () => {
    const getUrl = vi.fn(() => "https://cdn.example/thumb");
    expect(sidebarCharacterAvatarImageUrl(getUrl, "x", "")).toBeUndefined();
    expect(getUrl).not.toHaveBeenCalled();
    expect(sidebarCharacterAvatarImageUrl(getUrl, "x", "key")).toBe("https://cdn.example/thumb");
  });
});
