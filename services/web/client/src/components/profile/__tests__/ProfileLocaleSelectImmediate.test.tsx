import ProfileLocaleSelectImmediate from "@/components/profile/ProfileLocaleSelectImmediate";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateCurrentUserMock, pushMock, dispatchMock } = vi.hoisted(() => ({
  updateCurrentUserMock: vi.fn(),
  pushMock: vi.fn(),
  dispatchMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/profile",
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/services/UserService", () => ({
  default: {
    updateCurrentUser: updateCurrentUserMock,
  },
}));

vi.mock("@/store/hooks", () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("ProfileLocaleSelectImmediate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCurrentUserMock.mockResolvedValue({ preferredLocale: "en" });
  });

  it("renders the locale select in the preferences section", () => {
    const html = renderToStaticMarkup(<ProfileLocaleSelectImmediate />);

    expect(html).toContain('id="profile-locale-select"');
    expect(html).toContain('role="combobox"');
  });
});
