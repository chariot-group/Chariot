import { describe, expect, it } from "vitest";
import { isQuickLinkVisibleIn, isSharedQuickLink, splitQuickLinks } from "@/lib/quickLinkVisibility";
import type { QuickLink } from "@/types/quickLink";

const CAMPAIGN_A = "507f1f77bcf86cd799439011";
const CAMPAIGN_B = "507f1f77bcf86cd799439012";

function makeLink(overrides: Partial<QuickLink> = {}): QuickLink {
  return {
    _id: Math.random().toString(16).slice(2),
    icon: "Link",
    url: "https://example.com",
    label: "Lien",
    campaignId: null,
    createdBy: "user",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("FR-sidebar-quick-links — visibilité multi-espaces", () => {
  // ── nominal ─────────────────────────────────────────────────────────────────

  it("nominal: un lien partagé avec toutes les campagnes est visible sous A et B et commun", () => {
    const link = makeLink({ campaignId: CAMPAIGN_A, visibleInAllCampaigns: true });
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_A)).toBe(true);
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_B)).toBe(true);
    expect(isQuickLinkVisibleIn(link, null)).toBe(false);
    expect(isSharedQuickLink(link)).toBe(true);
  });

  it("nominal: un lien de campagne partagé avec l'espace joueur est visible sous A et dans l'espace joueur", () => {
    const link = makeLink({ campaignId: CAMPAIGN_A, visibleInPlayerSpace: true });
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_A)).toBe(true);
    expect(isQuickLinkVisibleIn(link, null)).toBe(true);
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_B)).toBe(false);
    expect(isSharedQuickLink(link)).toBe(true);
  });

  it("nominal: splitQuickLinks sépare liens propres et communs en gardant l'ordre", () => {
    const own1 = makeLink({ campaignId: CAMPAIGN_A });
    const shared = makeLink({ visibleInAllCampaigns: true });
    const own2 = makeLink({ campaignId: CAMPAIGN_A });
    const { own, shared: sharedLinks } = splitQuickLinks([own1, shared, own2]);
    expect(own).toEqual([own1, own2]);
    expect(sharedLinks).toEqual([shared]);
  });

  // ── edge ────────────────────────────────────────────────────────────────────

  it("edge: un lien existant sans les nouveaux champs reste propre à son espace", () => {
    const link = makeLink({ campaignId: CAMPAIGN_A });
    expect(isSharedQuickLink(link)).toBe(false);
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_B)).toBe(false);
    expect(isQuickLinkVisibleIn(link, null)).toBe(false);
  });

  it("edge: visibleInPlayerSpace sur un lien de l'espace joueur ne le rend pas commun", () => {
    const link = makeLink({ campaignId: null, visibleInPlayerSpace: true });
    expect(isSharedQuickLink(link)).toBe(false);
  });

  it("edge: sans filtre d'espace, tout lien est visible", () => {
    expect(isQuickLinkVisibleIn(makeLink({ campaignId: CAMPAIGN_A }), undefined)).toBe(true);
  });

  it("edge: un seul groupe non vide quand aucun lien n'est partagé", () => {
    const { own, shared } = splitQuickLinks([makeLink(), makeLink()]);
    expect(own).toHaveLength(2);
    expect(shared).toHaveLength(0);
  });

  // ── failure ─────────────────────────────────────────────────────────────────

  it("failure: décocher « toutes mes campagnes » retire le lien d'une autre campagne", () => {
    const link = makeLink({ campaignId: CAMPAIGN_A, visibleInAllCampaigns: false });
    expect(isQuickLinkVisibleIn(link, CAMPAIGN_B)).toBe(false);
  });
});
