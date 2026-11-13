import { describe, expect, it, vi } from "vitest";
import { MediaAvatarRequirementsHint, MediaAvatarUpload } from "@/components/media/MediaAvatarUpload";
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

  it("failure: the sheet avatar keeps the 4:5 hint and frame (round exception is profile only)", () => {
    const html = renderUpload("sheet");

    expect(html).toContain(">requirementsHint<");
    expect(html).not.toContain("requirementsHintRound");
    expect(html).toContain("aspect-[4/5]");
    expect(html).not.toContain("rounded-full");
  });
});

/** @see FR-media-avatars — profile photo exception (round display, square hint) */
describe("MediaAvatarUpload — round profile avatar", () => {
  it("nominal: the profile avatar is a square circle and its standalone hint recommends a square image", () => {
    const html = renderUpload("profile");
    const hint = render(
      <MediaAvatarRequirementsHint
        scope="character"
        entityId="c1"
        size="profile"
      />,
    );

    expect(html).toMatch(/class="relative overflow-hidden aspect-square[^"]*rounded-full"/);
    expect(hint).toMatch(/^<p id="avatar-requirements-character-c1"[^>]*>requirementsHintRound</);
  });

  it("edge: with renderRequirementsHint=false the hint is left to the parent, controls still point to its id", () => {
    const html = render(
      <MediaAvatarUpload
        scope="character"
        entityId="c1"
        storedValue={null}
        size="profile"
        alt="Avatar"
        deferUpload
        renderRequirementsHint={false}
        onPendingFile={vi.fn()}
        onPendingRemove={vi.fn()}
      />,
    );

    expect(html).not.toContain('<p id="avatar-requirements-character-c1"');
    expect(html).toContain('aria-describedby="avatar-requirements-character-c1"');
  });

  it("edge: the upload controls are lifted inside the circle", () => {
    expect(renderUpload("profile")).toContain("pb-2.5");
    expect(renderUpload("sheet")).not.toContain("pb-2.5");
  });
});
