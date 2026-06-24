import ProfileReferralSection from "@/components/profile/ProfileReferralSection";
import type { ReferralInfo } from "@/services/ReferralService";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return `${key}:${JSON.stringify(values)}`;
    }
    return key;
  },
}));

const baseReferralInfo: ReferralInfo = {
  id: "ref-1",
  code: "PARRAIN42",
  userId: "user-1",
  pendingReferralsCount: 2,
  currentDiscountPercent: 15,
  refereeCount: 3,
  validatedRefereeCount: 2,
  createdAt: "2025-01-01T00:00:00.000Z",
  referees: [],
  myRefereeDiscount: null,
};

describe("ProfileReferralSection", () => {
  it("renders compact tiers grid with accessible region", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={baseReferralInfo}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain('id="referral-tiers-heading"');
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("PARRAIN42");
    expect(html).toContain("copyLink");
    expect(html).toContain("50%");
  });

  it("renders referral rules tooltip trigger", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={baseReferralInfo}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain('aria-label="rulesTooltipAriaLabel"');
    expect(html).toContain("lucide-circle-question-mark");
  });

  it("shows next tier goal when no discount is available", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={{ ...baseReferralInfo, pendingReferralsCount: 0, currentDiscountPercent: 0 }}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain("10%");
    expect(html).toContain("nextTierGoal");
    expect(html).toContain('data-tier-state="upcoming"');
    expect(html).not.toContain('data-tier-state="current"');
    expect(html).not.toContain('data-tier-state="reached"');
  });

  it("fills only reached tiers when a discount is active", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={{ ...baseReferralInfo, pendingReferralsCount: 2, currentDiscountPercent: 15 }}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain('data-tier-state="current"');
    expect(html).toContain('data-tier-state="reached"');
    expect(html).toContain('data-tier-state="upcoming"');
  });
});
