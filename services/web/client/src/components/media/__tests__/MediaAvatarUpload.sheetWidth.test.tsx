import { describe, expect, it, vi } from "vitest";
import { MediaAvatarUpload } from "@/components/media/MediaAvatarUpload";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";

vi.mock("@/components/media/MediaAvatar", () => ({ MediaAvatar: () => null }));
vi.mock("@/services/MediaService", () => ({ default: {} }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

const renderUpload = (size: "sheet" | "profile") =>
  render(
    <MediaAvatarUpload
      scope="character"
      entityId="c1"
      storedValue={null}
      size={size}
      alt="Avatar"
      deferUpload
      onPendingFile={vi.fn()}
      onPendingRemove={vi.fn()}
    />,
  );

/** @see FR-frontend-design §6.4 — the avatar block of the « Personnage » card never overflows the card */
describe("MediaAvatarUpload — sheet width", () => {
  it("nominal: on the sheet the block is as wide as the avatar and the requirements hint wraps", () => {
    const html = renderUpload("sheet");
    const root = html.match(/^<div class="([^"]+)"/)?.[1] ?? "";

    expect(root.split(" ")).toEqual(expect.arrayContaining(["w-min", "max-w-full"]));
    expect(html).toMatch(/<p id="avatar-requirements-character-c1" class="[^"]*wrap-break-word/);
  });

  it("edge: the requirements hint stays visually hidden on mobile but readable by screen readers", () => {
    expect(renderUpload("sheet")).toMatch(/<p id="avatar-requirements-character-c1" class="[^"]*max-sm:sr-only/);
  });

  it("failure: the profile avatar keeps its own width (not constrained to the avatar)", () => {
    const root = renderUpload("profile").match(/^<div class="([^"]+)"/)?.[1] ?? "";

    expect(root.split(" ")).not.toContain("w-min");
  });
});
