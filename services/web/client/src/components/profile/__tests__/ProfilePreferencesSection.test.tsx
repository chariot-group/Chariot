import ProfilePreferencesSection from "@/components/profile/ProfilePreferencesSection";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      "sections.preferences": "Préférences",
      languagePreference: "Langue",
      languagePreferenceAria: "Langue du site",
      "languages.fr": "🇫🇷 Français",
      "languages.en": "🇬🇧 Anglais",
      "languages.es": "🇪🇸 Espagnol",
      measurementUnitPreference: "Unités de mesure",
      measurementUnitPreferenceAria: "Unités de mesure préférées",
      "measurementUnits.metric": "Mètres (m, kg)",
      "measurementUnits.imperial": "Pieds / Pouces (ft, lbs)",
    };
    return labels[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/profile",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/services/UserService", () => ({
  default: {
    updateCurrentUser: vi.fn(),
  },
}));

vi.mock("@/store/hooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => "metric",
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("ProfilePreferencesSection", () => {
  it("renders the preferences section with locale select", () => {
    const html = renderToStaticMarkup(<ProfilePreferencesSection />);

    expect(html).toContain("Préférences");
    expect(html).toContain('id="profile-locale-select"');
    expect(html).toContain('role="combobox"');
  });
});
