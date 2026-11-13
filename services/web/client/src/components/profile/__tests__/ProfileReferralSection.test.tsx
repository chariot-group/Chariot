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
    expect(html).not.toContain("maxDiscountLabel");
    expect(html).not.toContain("maxDiscountAriaLabel");
  });

  it("nominal: the segmented bar starts with a 0 % step, then one segment per tier", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={baseReferralInfo}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );
    const segments = [...html.matchAll(/role="listitem"[^>]*>.*?>(\d+)%</g)].map((m) => Number(m[1]));

    expect(segments[0]).toBe(0);
    expect(segments.slice(1)).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50]);
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
    // only the leading 0 % step is current
    expect(html.match(/data-tier-state="current"/g)).toHaveLength(1);
    expect(html).toContain('data-tier-state="current" aria-label="tierSegmentAriaLabel:{&quot;count&quot;:0,&quot;discount&quot;:0}"');
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

  it("shows pending tier segments in yellow when pending referrals exist", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={{
          ...baseReferralInfo,
          pendingReferralsCount: 1,
          currentDiscountPercent: 10,
          refereeCount: 3,
          validatedRefereeCount: 1,
        }}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    // tier 1 = validated (current), tier 2-3 = pending, tier 4+ = upcoming
    expect(html).toContain('data-tier-state="current"');
    expect(html).toContain('data-tier-state="pending"');
    expect(html).toContain('data-tier-state="pending-current"');
    expect(html).toContain('data-tier-state="upcoming"');
    expect(html).toContain("tierSegmentPendingAriaLabel");
  });

  it("shows no pending segments when pendingCount is 0", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={{
          ...baseReferralInfo,
          pendingReferralsCount: 2,
          currentDiscountPercent: 15,
          refereeCount: 2,
          validatedRefereeCount: 2,
        }}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).not.toContain('data-tier-state="pending"');
    expect(html).not.toContain('data-tier-state="pending-current"');
    expect(html).not.toContain("tierSegmentPendingAriaLabel");
  });

  it("keeps validated tiers as primary regardless of pending count", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={{
          ...baseReferralInfo,
          pendingReferralsCount: 3,
          currentDiscountPercent: 20,
          refereeCount: 5,
          validatedRefereeCount: 3,
        }}
        linkCopyState="idle"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain('data-tier-state="current"');
    expect(html).toContain('data-tier-state="reached"');
    expect(html).toContain('data-tier-state="pending"');
    expect(html).toContain('data-tier-state="pending-current"');
  });

  it("keeps the copied link button secondary, white and the same width while it is locked", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={baseReferralInfo}
        linkCopyState="success"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain("linkCopied");
    expect(html).toContain("disabled:opacity-100");
    expect(html).not.toContain("[&amp;_svg]:text-green");
    expect(html).toContain("data-stable-label-ghost");
    expect(html).toContain("bg-gray-middle-light");
    expect(html).not.toContain("bg-green");
  });

  it("locks the copy button without the green state while copying", () => {
    const html = renderToStaticMarkup(
      <ProfileReferralSection
        referralInfo={baseReferralInfo}
        linkCopyState="loading"
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).toContain('aria-label="copyLinkAriaLabel" disabled=""');
    expect(html).not.toContain("[&amp;_svg]:text-green");
  });
});

const renderSection = (info: Partial<ReferralInfo>) =>
  renderToStaticMarkup(
    <ProfileReferralSection
      referralInfo={{ ...baseReferralInfo, ...info }}
      linkCopyState="idle"
      onCopyLink={vi.fn()}
    />,
  );

const compactOf = (html: string) => {
  const start = html.indexOf('data-testid="referral-tiers-compact"');
  const end = html.indexOf('class="hidden lg:flex', start);
  return html.slice(start, end);
};

/** @see FR-stripe-checkout — Profile Tiers Display (compact view below lg) */
describe("ProfileReferralSection — compact tiers view", () => {
  it("nominal: shows the current discount, a progressbar and the next tier goal; segmented bar only from lg", () => {
    const html = renderSection({ pendingReferralsCount: 2, refereeCount: 2, validatedRefereeCount: 2 });
    const compact = compactOf(html);

    expect(html).toContain('class="flex flex-col gap-3 lg:hidden"');
    expect(html).toContain('class="hidden lg:flex lg:flex-row lg:items-center lg:gap-3 min-w-0"');
    expect(compact).toContain(">15%<");
    expect(compact).toMatch(/role="progressbar"[^>]*aria-valuemax="50"[^>]*aria-valuenow="15"/);
    expect(compact).toMatch(/style="width:30%"[^>]*data-fill="current"/);
    expect(compact).not.toContain('data-fill="pending"');
    expect(html).toContain("nextTierGoal:{&quot;count&quot;:1,&quot;discount&quot;:20}");
  });

  it("edge: pending referrals fill the bar in yellow up to the pending discount and state it in text", () => {
    const compact = compactOf(renderSection({ pendingReferralsCount: 2, refereeCount: 3, validatedRefereeCount: 2 }));

    expect(compact).toMatch(/style="width:40%"[^>]*data-fill="pending"/);
    expect(compact).toContain("compactPendingPotential:{&quot;discount&quot;:20}");
  });

  it("edge: the max tier fills the whole bar", () => {
    const compact = compactOf(renderSection({ pendingReferralsCount: 9, refereeCount: 9, validatedRefereeCount: 9 }));

    expect(compact).toMatch(/style="width:100%"[^>]*data-fill="current"/);
    expect(compact).toContain(">50%<");
  });

  it("failure: no referral at all shows 0 % and an empty bar without pending potential", () => {
    const compact = compactOf(renderSection({ pendingReferralsCount: 0, refereeCount: 0, validatedRefereeCount: 0 }));

    expect(compact).toContain(">0%<");
    expect(compact).toMatch(/class="[^"]*min-w-3[^"]*" style="width:0%"[^>]*data-fill="current"/);
    expect(compact).not.toContain("compactPendingPotential");
  });
});
