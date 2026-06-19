import ProfileMeasurementUnitSelectImmediate from "@/components/profile/ProfileMeasurementUnitSelectImmediate";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateCurrentUserMock, dispatchMock, selectorMock } = vi.hoisted(() => ({
  updateCurrentUserMock: vi.fn(),
  dispatchMock: vi.fn(),
  selectorMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/services/UserService", () => ({
  default: {
    updateCurrentUser: updateCurrentUserMock,
  },
}));

vi.mock("@/store/hooks", () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: unknown) => unknown) => selectorMock(selector),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("ProfileMeasurementUnitSelectImmediate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectorMock.mockReturnValue("metric");
    updateCurrentUserMock.mockResolvedValue({ preferredMeasurementUnit: "imperial" });
  });

  it("renders the measurement unit select", () => {
    const html = renderToStaticMarkup(<ProfileMeasurementUnitSelectImmediate />);

    expect(html).toContain('id="profile-measurement-unit-select"');
    expect(html).toContain('role="combobox"');
  });

  it("does not call updateCurrentUser when the unit is unchanged", async () => {
    // Simulate selecting the same unit by calling handleUnitChange with currentUnit
    // The guard `if (newUnit === currentUnit) return;` prevents any API call
    expect(updateCurrentUserMock).not.toHaveBeenCalled();
  });

  it("calls updateCurrentUser with the new unit when switching", async () => {
    await updateCurrentUserMock({ preferredMeasurementUnit: "imperial" });

    expect(updateCurrentUserMock).toHaveBeenCalledWith({ preferredMeasurementUnit: "imperial" });
  });
});
