import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import type { Action } from "@/types/character";

const createTestStore = () =>
  configureStore({
    reducer: {
      user: (state = { user: { preferredMeasurementUnit: "imperial" }, loading: false, error: null, lastFetch: null }) => state,
    },
  });

const messages = {
  characterDetail: {
    battle: {
      actionDetails: "Details for action:",
      attackDC: "Attack/DC:",
      damageType: "Damage/Type:",
      description: "Description:",
      details: "details",
      usageTypeOptions: {
        action: "Action",
        bonus_action: "Bonus action",
        reaction: "Reaction",
      },
      usageTypeUnavailableTooltip: "No {type} is available for this character.",
      usageTypePriorityGroup: "Action type priority for {section}",
      usageTypePriorityButton: "{type}, {count} available, {selected}",
      selected: "selected",
      notSelected: "not selected",
      expandSectionActions: "Expand actions in {section}",
      collapseSectionActions: "Collapse actions in {section}",
    },
    magic: {
      collapseAll: "Collapse all",
      expandAll: "Expand all",
    },
  },
};

const renderActionSection = (actions: Action[], title = "Actions") => renderToStaticMarkup(
  <Provider store={createTestStore()}>
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={messages}>
      <ActionSection
        title={title}
        actions={actions}
        accentColor="text-red"
      />
    </NextIntlClientProvider>
  </Provider>,
);

/** @see FR-character-action-section-visibility: Combat Action Section Visible When Empty */
describe("FR-character-action-section-visibility — ActionSection", () => {
  it("nominal: exposes section, priority group, pressed state, and action details region", () => {
    const html = renderActionSection([
      {
        name: "Longsword",
        usageType: "action",
        attackBonus: 5,
        damage: [{ dice: "1d8+3", type: "slashing" }],
        description: "A melee attack.",
      },
    ]);

    expect(html).toContain(">Actions</h2>");
    expect(html).toContain('aria-label="Action type priority for Actions"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Action, 1 available, selected"');
    expect(html).toContain('aria-label="Expand actions in Actions"');
    expect(html).toContain('role="region"');
    expect(html).toContain("Details for action: Longsword");
  });

  it("edge: unavailable usage type remains announced as disabled and not selected", () => {
    const html = renderActionSection([
      {
        name: "Parry",
        usageType: "reaction",
        attackBonus: 0,
        damage: [],
      },
    ]);

    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Bonus action, 0 available, not selected"');
  });

  it("edge: empty section still shows the heading with expand-all disabled and no action cards", () => {
    const html = renderActionSection([]);

    expect(html).toContain(">Actions</h2>");
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain("disabled");
    expect(html).toContain('aria-label="Expand actions in Actions"');
    expect(html).not.toContain("Details for action:");
    expect(html).not.toContain('role="region"');
  });

  it("edge: empty legendary and lair sections still show their headings", () => {
    expect(renderActionSection([], "Legendary actions")).toContain(">Legendary actions</h2>");
    expect(renderActionSection([], "Lair actions")).toContain(">Lair actions</h2>");
  });

  it("failure: empty section MUST NOT omit the heading or invent placeholder actions", () => {
    const html = renderActionSection([]);

    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain(">Actions</h2>");
    expect(html).not.toContain("Longsword");
    expect(html).not.toContain("Details for action:");
  });
});
