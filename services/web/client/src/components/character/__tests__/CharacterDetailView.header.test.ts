import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const characterDir = fileURLToPath(new URL("..", import.meta.url));
const generalDir = resolve(characterDir, "tabContents/general");
const detailViewPath = resolve(characterDir, "CharacterDetailView.tsx");
const formViewPath = resolve(characterDir, "CharacterFormView.tsx");
const tabPanelsPath = resolve(characterDir, "CharacterTabPanels.tsx");
const generalTabPath = resolve(generalDir, "CharacterGeneralTabContent.tsx");
const generalVariantPaths = [
  resolve(generalDir, "view/PlayerGeneralTabContent.tsx"),
  resolve(generalDir, "view/NpcGeneralTabContent.tsx"),
  resolve(generalDir, "form/PlayerGeneralTabEdit.tsx"),
  resolve(generalDir, "form/NpcGeneralTabEdit.tsx"),
];
const avatarUploadPath = resolve(
  fileURLToPath(new URL("../../media", import.meta.url)),
  "MediaAvatarUpload.tsx",
);

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

/** @see FR-character-detail-view — tab navbar only, no identity header */
describe("Character sheet top bar", () => {
  it("nominal: detail and creation views render only the tab navbar above the content", () => {
    for (const path of [detailViewPath, formViewPath]) {
      const source = readSource(path);

      expect(source).toContain("<CharacterTabs");
      expect(source).not.toContain("CharacterSheetHeader");
      expect(source).not.toContain("<h1");
    }
  });

  it("edge: the former header components no longer exist", () => {
    expect(existsSync(resolve(characterDir, "CharacterSheetHeader.tsx"))).toBe(false);
    expect(existsSync(resolve(characterDir, "CharacterSheetHeaderIdentity.tsx"))).toBe(false);
  });

  it("failure: identity details are not rendered above the tabs anymore", () => {
    const source = readSource(detailViewPath);

    expect(source).not.toContain("classLevelShort");
    expect(source).not.toContain("challengeRatingAbbr");
    expect(source).not.toContain("formatChallengeRating");
  });
});

describe("Character avatar in General tab", () => {
  it("nominal: detail view passes the avatar to the General tab through the tab panels", () => {
    const detailSource = readSource(detailViewPath);
    const panelsSource = readSource(tabPanelsPath);
    const generalSource = readSource(generalTabPath);

    expect(detailSource).toContain("generalAvatar={generalTabAvatar}");
    expect(panelsSource).toContain("avatar={generalAvatar}");
    expect(generalSource.match(/avatar=\{avatar\}/g)).toHaveLength(4);
  });

  it("edge: every General tab variant renders the avatar inside the « Personnage » card", () => {
    for (const path of generalVariantPaths) {
      const source = readSource(path);

      expect(source).toContain("avatar?: ReactNode;");
      expect(source).toContain('{avatar ? <div className="shrink-0">{avatar}</div> : null}');
    }
  });

  it("edge: edit mode keeps the deferred avatar upload, read mode the plain avatar", () => {
    const source = readSource(detailViewPath);

    expect(source).toMatch(/generalTabAvatar =[\s\S]*<MediaAvatarUpload[\s\S]*deferUpload[\s\S]*<MediaAvatar\b/);
  });

  it("failure: creation form shows no avatar (character does not exist yet)", () => {
    const source = readSource(formViewPath);

    expect(source).not.toContain("generalAvatar");
    expect(source).not.toContain("MediaAvatar");
  });

  it("failure: hides sheet avatar requirements on mobile so the column stays avatar-sized", () => {
    const source = readSource(avatarUploadPath);

    expect(source).toContain('size === "sheet" && "max-sm:sr-only"');
  });
});
