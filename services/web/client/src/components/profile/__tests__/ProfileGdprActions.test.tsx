import ProfileGdprActions from "@/components/profile/ProfileGdprActions";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/profile",
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({
    user: {
      keycloakId: "abc-123",
      email: "user@example.com",
      username: "adventurer",
      balance: 0,
      history: [],
    },
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("ProfileGdprActions", () => {
  it("renders GDPR actions with accessible labels", () => {
    const html = renderToStaticMarkup(<ProfileGdprActions />);

    expect(html).toContain('id="gdpr-heading"');
    expect(html).toContain("title");
    expect(html).toContain("exportAriaLabel");
    expect(html).toContain("dataRequestAriaLabel");
    expect(html).toContain("deleteAriaLabel");
  });

  it("renders delete trigger with dialog semantics", () => {
    const html = renderToStaticMarkup(<ProfileGdprActions />);

    expect(html).toContain("deleteAction");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("deleteAriaLabel");
  });
});
