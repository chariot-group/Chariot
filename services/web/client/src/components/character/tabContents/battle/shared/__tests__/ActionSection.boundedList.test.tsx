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
      user: (
        state = { user: { preferredMeasurementUnit: "imperial" }, loading: false, error: null, lastFetch: null },
      ) => state,
    },
  });

const actions = Array.from({ length: 20 }, (_, i) => ({
  name: `Attack ${i + 1}`,
  usageType: "action",
  attackBonus: 4,
  damage: [{ dice: "1d6", type: "slashing" }],
})) as unknown as Action[];

const render = (props: { actions: Action[]; boundedList?: boolean }) =>
  renderToStaticMarkup(
    <Provider store={createTestStore()}>
      <NextIntlClientProvider
        locale="en"
        timeZone="UTC"
        messages={{}}
        onError={() => {}}
        getMessageFallback={({ key }) => key}>
        <ActionSection
          title="Actions"
          accentColor="text-red"
          {...props}
        />
      </NextIntlClientProvider>
    </Provider>,
  );

/** Opening tag of the bounded scroll area, if any. */
const scrollArea = (html: string) => html.match(/<div[^>]*class="max-h-\[28rem\] overflow-y-auto[^"]*"[^>]*>/)?.[0];

/** @see FR-character-battle-bento-layout — long action lists scroll inside their section in read mode */
describe("ActionSection — bounded list", () => {
  it("nominal: a bounded section wraps every action item in one focusable, labelled scroll area", () => {
    const html = render({ actions, boundedList: true });
    const area = scrollArea(html);
    const headingId = html.match(/<h2[^>]*id="([^"]+)"/)?.[1];

    expect(area).toBeDefined();
    expect(area).toContain('role="group"');
    expect(area).toContain('tabindex="0"');
    expect(area).toContain(`aria-labelledby="${headingId}"`);
    expect(html.slice(html.indexOf(area!))).toContain("Attack 20");
  });

  it("edge: the header controls stay outside the scroll area", () => {
    const html = render({ actions, boundedList: true });

    expect(html.indexOf("<h2")).toBeLessThan(html.indexOf(scrollArea(html)!));
  });

  it("failure: without boundedList (edit-like usage) no scroll area is rendered", () => {
    expect(scrollArea(render({ actions }))).toBeUndefined();
  });
});
