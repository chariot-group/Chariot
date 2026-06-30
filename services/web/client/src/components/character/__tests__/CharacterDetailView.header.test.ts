import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailViewPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx");
const formViewPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterFormView.tsx");
const identityPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterSheetHeaderIdentity.tsx");
const headerPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterSheetHeader.tsx");
const avatarUploadPath = resolve(
  fileURLToPath(new URL("../../media", import.meta.url)),
  "MediaAvatarUpload.tsx",
);

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

describe("Character sheet header identity layout", () => {
  it("nominal: uses a bounded grid so names truncate with ellipsis beside the avatar", () => {
    const source = readSource(identityPath);

    expect(source).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(source).toContain("truncate text-left text-2xl");
    expect(source).toContain("truncate text-left text-sm italic");
  });

  it("edge: stacks tabs below identity on mobile, aligns tabs with avatar column from lg", () => {
    const detailSource = readSource(detailViewPath);
    const formSource = readSource(formViewPath);
    const headerSource = readSource(headerPath);
    const tabsSource = readSource(resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterTabs.tsx"));

    expect(detailSource).toContain("<CharacterSheetHeader");
    expect(formSource).toContain("<CharacterSheetHeader");
    expect(headerSource).toContain("flex w-full flex-col gap-4 pb-2");
    expect(headerSource).toContain("min-w-0 w-full overflow-x-auto");
    expect(headerSource).toContain("lg:grid lg:grid-cols-[minmax(0,1fr)_auto]");
    expect(headerSource).toContain("lg:col-start-1 lg:row-start-2");
    expect(headerSource).toContain("lg:col-start-2 lg:row-start-1 lg:row-span-2");
    expect(tabsSource).toContain("flex-nowrap");
  });

  it("edge: keeps identity text left-aligned inside the header block", () => {
    const identitySource = readSource(identityPath);

    expect(identitySource).toContain("text-left text-2xl");
    expect(identitySource).toContain("text-left text-sm italic");
  });

  it("failure: hides sheet avatar requirements on mobile so the column stays avatar-sized", () => {
    const source = readSource(avatarUploadPath);

    expect(source).toContain('size === "sheet" && "max-sm:sr-only"');
  });
});

describe("CharacterDetailView header form sync", () => {
  it("reflects form values in the header while editing", () => {
    const source = readSource(detailViewPath);

    expect(source).toContain('form.watch("firstname")');
    expect(source).toContain('form.watch("lastname")');
    expect(source).toContain('form.watch("surname")');
  });
});
