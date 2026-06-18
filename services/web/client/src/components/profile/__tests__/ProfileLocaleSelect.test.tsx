import ProfileLocaleSelect from "@/components/profile/ProfileLocaleSelect";
import { replaceLocaleInPath } from "@/hooks/useLocalePreference";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      languagePreference: "Langue",
      languagePreferenceAria: "Langue du site",
      "languages.fr": "🇫🇷 Français",
      "languages.en": "🇬🇧 Anglais",
      "languages.es": "🇪🇸 Espagnol",
    };
    return labels[key] ?? key;
  },
}));

describe("ProfileLocaleSelect", () => {
  it("renders the locale select with label and accessible name", () => {
    const html = renderToStaticMarkup(
      <ProfileLocaleSelect
        value="fr"
        onValueChange={() => {}}
      />,
    );

    expect(html).toContain('id="profile-locale-select"');
    expect(html).toContain("Langue");
    expect(html).toContain("Langue du site");
  });

  it("renders a combobox bound to the locale preference label", () => {
    const html = renderToStaticMarkup(
      <ProfileLocaleSelect
        value="fr"
        onValueChange={() => {}}
      />,
    );

    expect(html).toContain('role="combobox"');
    expect(html).toContain('for="profile-locale-select"');
    expect(html).toContain('id="profile-locale-select"');
    expect(html).toContain("🇫🇷 Français");
  });
});

describe("replaceLocaleInPath", () => {
  it("replaces the locale segment in a prefixed path", () => {
    expect(replaceLocaleInPath("/fr/profile", "en")).toBe("/en/profile");
  });

  it("prepends locale when path has no locale prefix", () => {
    expect(replaceLocaleInPath("/profile", "es")).toBe("/es/profile");
  });

  it("returns locale root for empty remainder", () => {
    expect(replaceLocaleInPath("/fr", "en")).toBe("/en");
  });
});
