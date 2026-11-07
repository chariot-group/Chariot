import { configureStore } from "@reduxjs/toolkit";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import ActionSection from "@/components/character/tabContents/battle/shared/ActionSection";
import type { Action } from "@/types/character";

const store = configureStore({
  reducer: { user: (state = { user: { preferredMeasurementUnit: "metric" } }) => state },
});

const renderSection = (actions: Action[]) =>
  renderToStaticMarkup(
    <Provider store={store}>
      <NextIntlClientProvider
        locale="en"
        timeZone="UTC"
        messages={{}}
        onError={() => {}}
        getMessageFallback={({ key }) => key}>
        <ActionSection
          title="Actions"
          actions={actions}
          accentColor="text-red"
        />
      </NextIntlClientProvider>
    </Provider>,
  );

const usageButtons = (html: string) => html.match(/<button[^>]*aria-pressed="(?:true|false)"[^>]*>/g) ?? [];

/** @see FR-frontend-design — violet is reserved for primary fills, selection uses the neutral gray */
describe("ActionSection — usage type filter", () => {
  it("nominal: the active filter uses the neutral selection gray, not the violet fill", () => {
    const html = renderSection([{ name: "Strike", usageType: "action" } as Action]);
    const [active, ...others] = usageButtons(html);

    expect(active).toContain('aria-pressed="true"');
    expect(active).toContain("bg-white/15");
    expect(active).not.toContain("bg-primary");
    others.forEach((button) => expect(button).not.toContain("bg-white/15"));
  });

  it("edge: an empty usage type stays dimmed and unpressed", () => {
    const html = renderSection([{ name: "Strike", usageType: "action" } as Action]);
    const reaction = usageButtons(html)[2];

    expect(reaction).toContain('aria-pressed="false"');
    expect(reaction).toContain('aria-disabled="true"');
    expect(reaction).toContain("opacity-45");
  });

  it("failure: no filter button falls back to the violet default variant", () => {
    const html = renderSection([]);

    expect(usageButtons(html)).toHaveLength(3);
    usageButtons(html).forEach((button) => expect(button).not.toMatch(/\bbg-primary\b/));
  });
});
