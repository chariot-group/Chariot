import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConcentrationStateBadge } from "@/components/initiativeTracker/ConcentrationStateBadge";

const baseConcentration = { spellName: "Entangle" };

describe("FR-tracker-concentration — ConcentrationStateBadge", () => {
  it("nominal: renders adaptive slot and spell detail in Radix tooltip", () => {
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
    expect(html).toContain("Concentré (Entangle)");
    expect(html).not.toContain('title="Concentré (Entangle)"');
    expect(html).toContain('data-slot="tooltip-trigger"');
    expect(html).toContain('data-concentration-badge-label=""');
    expect(html).toContain("shrink-0");
    expect(html).toContain("w-max");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("border-purple-300/55");
    expect(html).toContain("bg-purple-500/45");
    expect(html).toContain("text-purple-50");
    expect(html).toContain("lucide-sparkles");
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
    const buttonBlocks = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) ?? [];
    for (const block of buttonBlocks) {
      const inner = block.replace(/^<button\b[^>]*>/, "").replace(/<\/button>$/, "");
      expect(inner).not.toMatch(/<button\b/);
    }
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
    expect(html).toContain("lucide-triangle-alert");
    expect(html).not.toContain("lucide-sparkles");
    expect(html).toContain('aria-label="Ouvrir le rappel"');
    expect(html).toContain("border-yellow-300/60");
    expect(html).toContain("bg-yellow-500/45");
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
    expect(html).not.toContain('title="Concentré (Entangle)"');
    expect(html).toContain("Concentré (Entangle)");
  });
});
