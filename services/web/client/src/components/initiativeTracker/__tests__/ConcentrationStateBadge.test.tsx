import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConcentrationStateBadge } from "@/components/initiativeTracker/ConcentrationStateBadge";

const baseConcentration = { spellName: "Entangle" };

describe("FR-tracker-concentration — ConcentrationStateBadge", () => {
  it("nominal: renders adaptive slot and spell detail in tooltip title", () => {
    const html = renderToStaticMarkup(
      <ConcentrationStateBadge
        concentration={baseConcentration}
        badgeLabel="Concentré"
        badgeShort="C"
        detailLabel="Concentré (Entangle)"
        changeLabel="Changer"
        dropLabel="Lâcher"
      />,
    );

    expect(html).toContain("Concentré");
    expect(html).toContain('title="Concentré (Entangle)"');
    expect(html).toContain('data-concentration-badge-label=""');
    expect(html).toContain("shrink-0");
    expect(html).toContain("w-max");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("border-white/20");
    expect(html).toContain("text-white/60");
    expect(html).not.toContain("lucide-sparkles");
  });

  it("edge: editable badge is a single clickable control with isolated drop action", () => {
    const html = renderToStaticMarkup(
      <ConcentrationStateBadge
        concentration={baseConcentration}
        badgeLabel="Concentré"
        badgeShort="C"
        detailLabel="Concentré (Entangle)"
        changeLabel="Changer"
        dropLabel="Lâcher"
        canEdit
        onEdit={() => undefined}
        onRemove={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Changer. Concentré (Entangle)"');
    expect(html).toContain('aria-label="Lâcher"');
    expect(html).not.toContain("lucide-pencil");
  });

  it("edge: pending check keeps warning styling and activation label", () => {
    const html = renderToStaticMarkup(
      <ConcentrationStateBadge
        concentration={baseConcentration}
        badgeLabel="Concentré"
        badgeShort="C"
        detailLabel="Concentré (Entangle)"
        changeLabel="Changer"
        dropLabel="Lâcher"
        pendingCheck={{ damageAmount: 8, dc: 10 }}
        pendingCheckLabel="CON DC 10"
        pendingCheckActivateLabel="Ouvrir le rappel"
        onPendingCheckActivate={() => undefined}
      />,
    );

    expect(html).toContain("CON DC 10");
    expect(html).toContain('aria-label="Ouvrir le rappel"');
    expect(html).toContain("border-yellow/35");
  });

  it("failure: info affordance is omitted when touch is unavailable (SSR)", () => {
    const html = renderToStaticMarkup(
      <ConcentrationStateBadge
        concentration={baseConcentration}
        badgeLabel="Concentré"
        badgeShort="C"
        detailLabel="Concentré (Entangle)"
        changeLabel="Changer"
        dropLabel="Lâcher"
      />,
    );

    expect(html).not.toContain("lucide-info");
    expect(html).toContain('title="Concentré (Entangle)"');
  });
});
