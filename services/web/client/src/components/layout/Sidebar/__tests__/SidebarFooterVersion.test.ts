import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sidebarSourcePath = resolve(fileURLToPath(new URL("..", import.meta.url)), "index.tsx");
const layoutSourcePath = resolve(
  fileURLToPath(new URL("../../../../app/[locale]/layout.tsx", import.meta.url)),
);
const profilePreferencesSectionPath = resolve(
  fileURLToPath(new URL("../../../../components/profile/ProfilePreferencesSection.tsx", import.meta.url)),
);

function readSidebarSource() {
  return readFileSync(sidebarSourcePath, "utf8");
}

function readLayoutSource() {
  return readFileSync(layoutSourcePath, "utf8");
}

function readProfilePreferencesSectionSource() {
  return readFileSync(profilePreferencesSectionPath, "utf8");
}

describe("FR-app-version-display — app version display", () => {
  it("nominal: displays the app version in ProfilePreferencesSection alongside the release notes button", () => {
    const source = readProfilePreferencesSectionSource();

    expect(source).toContain("process.env.NEXT_PUBLIC_APP_VERSION");
    expect(source).toContain("Chariot v{process.env.NEXT_PUBLIC_APP_VERSION}");
  });

  it("nominal: version is rendered inside the release notes block", () => {
    const source = readProfilePreferencesSectionSource();
    const releaseNotesIdx = source.indexOf("releaseNotes.openButton");
    const versionIdx = source.indexOf("NEXT_PUBLIC_APP_VERSION");

    expect(releaseNotesIdx).toBeGreaterThan(-1);
    expect(versionIdx).toBeGreaterThan(releaseNotesIdx);
  });

  it("failure guard: sidebar no longer contains the app version", () => {
    const source = readSidebarSource();

    expect(source).not.toContain("NEXT_PUBLIC_APP_VERSION");
    expect(source).not.toContain("Chariot v{appVersion}");
  });

  it("failure guard: removes the global overlay version from the app layout", () => {
    const source = readLayoutSource();

    expect(source).not.toContain("Chariot v{appVersion}");
    expect(source).not.toContain("NEXT_PUBLIC_APP_VERSION");
  });
});
