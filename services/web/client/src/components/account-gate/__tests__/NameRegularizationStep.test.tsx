import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NameRegularizationStep from "@/components/account-gate/NameRegularizationStep";
import type { User } from "@/types/user";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/services/UserService", () => ({
  default: { updateCurrentUser: vi.fn() },
}));

// @see FR-user-profile-keycloak: Irregular account regularization
const user: User = {
  keycloakId: "abc-123",
  email: "user@example.com",
  username: "adventurer",
  firstName: "Jean",
  lastName: "1",
  balance: 0,
  history: [],
  accountStatus: { invalidFields: ["lastName"] },
};

const render = (value: User) => renderToStaticMarkup(<NameRegularizationStep user={value} onSaved={vi.fn()} />);

describe("NameRegularizationStep", () => {
  it("nominal: shows only the offending field, pre-filled with the current value", () => {
    const html = render(user);

    expect(html).toContain('id="account-gate-lastName"');
    expect(html).toContain('value="1"');
    expect(html).not.toContain('id="account-gate-firstName"');
  });

  it("edge: shows both fields when both are invalid, with labels and autocomplete", () => {
    const html = render({ ...user, firstName: "", accountStatus: { invalidFields: ["firstName", "lastName"] } });

    expect(html).toContain('for="account-gate-firstName"');
    expect(html).toContain('for="account-gate-lastName"');
    expect(html).toContain('autoComplete="given-name"');
    expect(html).toContain('autoComplete="family-name"');
    expect(html.indexOf("account-gate-firstName")).toBeLessThan(html.indexOf("account-gate-lastName"));
  });

  it("failure: the form exposes required fields and a submit action, without error before validation", () => {
    const html = render(user);

    expect(html).toContain('aria-required="true"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("submit");
    expect(html).not.toContain('role="alert"');
  });
});
