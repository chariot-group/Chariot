import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CurrentVersionBadge,
  resolveSelectedNote,
  VersionSelect,
  VersionSidebar,
} from "@/components/dialogs/ReleaseNotesModal";
import { ALL_RELEASE_NOTES, CURRENT_APP_VERSION } from "@/data/release-notes";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));

const noop = () => {};

/** @see FR-release-notes (responsive version navigation) */
describe("ReleaseNotesModal version navigation", () => {
  it("nominal: mobile select is labelled and its closed value spaces the current dot", () => {
    const html = renderToStaticMarkup(
      <VersionSelect
        notes={ALL_RELEASE_NOTES}
        selectedVersion={ALL_RELEASE_NOTES[0].version}
        locale="en"
        onSelect={noop}
        label="Navigate to a previous version"
        currentVersion={ALL_RELEASE_NOTES[0].version}
        currentLabel="Current"
      />,
    );

    expect(html).toContain('aria-label="Navigate to a previous version"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain("rounded-full");
    expect(html).toMatch(/class="flex items-center gap-1\.5">[^<]*<span[^>]*bg-accent/);
  });

  it("nominal: side navigation lists every version and only marks the selected one", () => {
    const selected = ALL_RELEASE_NOTES[1].version;
    const html = renderToStaticMarkup(
      <VersionSidebar
        notes={ALL_RELEASE_NOTES}
        selectedVersion={selected}
        locale="en"
        onSelect={noop}
        label="Versions"
        currentVersion={ALL_RELEASE_NOTES[0].version}
        currentLabel="Current"
      />,
    );

    expect(html).toMatch(/^<nav[^>]*aria-label="Versions"/);
    expect(html).toContain("hidden sm:block");
    expect(html.match(/<button/g)).toHaveLength(ALL_RELEASE_NOTES.length);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`aria-current="true"[^>]*>.*?${selected.replace(/\./g, "\\.")}`));
    expect(html.match(/>Current</g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`${ALL_RELEASE_NOTES[0].version.replace(/\./g, "\\.")}<span[^>]*>.*?Current`));
  });

  it("edge: mobile current marker is a dot with a screen-reader label only", () => {
    const html = renderToStaticMarkup(
      <CurrentVersionBadge
        label="Current"
        compact
      />,
    );

    expect(html).toContain("rounded-full bg-accent");
    expect(html).toContain('<span class="sr-only">Current</span>');
    expect(html).not.toContain("border-accent");
  });

  it("edge: an unknown version falls back to the latest note", () => {
    expect(resolveSelectedNote(ALL_RELEASE_NOTES, "0.0.0-unknown")).toBe(ALL_RELEASE_NOTES[0]);
    expect(resolveSelectedNote(ALL_RELEASE_NOTES, ALL_RELEASE_NOTES[2].version)).toBe(ALL_RELEASE_NOTES[2]);
  });

  it("failure: no notes resolves to undefined instead of throwing", () => {
    expect(resolveSelectedNote([], CURRENT_APP_VERSION)).toBeUndefined();
  });
});
