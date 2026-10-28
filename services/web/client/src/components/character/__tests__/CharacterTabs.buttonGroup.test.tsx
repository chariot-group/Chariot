import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CharacterTabs, { type CharacterTab } from "@/components/character/CharacterTabs";
import { Tabs } from "@/components/ui/tabs";

const messages = {
  characterDetail: {
    tabs: {
      general: "General",
      battle: "Battle",
      magic: "Magic",
      inventory: "Inventory",
      history: "History",
      containsErrors: "This tab contains invalid fields",
    },
  },
};

const renderTabs = (activeTab: CharacterTab, tabsWithErrors?: Partial<Record<CharacterTab, boolean>>) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={messages}>
      <Tabs value={activeTab}>
        <CharacterTabs
          activeTab={activeTab}
          tabsWithErrors={tabsWithErrors}
        />
      </Tabs>
    </NextIntlClientProvider>,
  );

const triggerOf = (html: string, label: string) =>
  html.match(new RegExp(`<button[^>]*>(?:(?!</button>).)*${label}(?:(?!</button>).)*</button>`))?.[0] ?? "";

describe("CharacterTabs — joined button group", () => {
  it("nominal: one rounded frame with joined, divided triggers and the domain color on the active tab", () => {
    const html = renderTabs("battle");
    const list = html.match(/<div[^>]*role="tablist"[^>]*>/)?.[0] ?? "";

    expect(list).toContain("gap-0");
    expect(list).toContain("rounded-[13px]");
    expect(list).toContain("overflow-hidden");
    expect(list).toContain("border-frame");
    expect(triggerOf(html, "Battle")).toContain("bg-red text-black");
    expect(triggerOf(html, "Battle")).not.toContain("text-white");
    expect(triggerOf(html, "Battle")).toContain('aria-selected="true"');
    expect(triggerOf(html, "Magic")).toContain("rounded-none");
    expect(triggerOf(html, "Magic")).toContain("border-l border-frame");
    expect(triggerOf(html, "Magic")).toContain("bg-transparent");
  });

  it("edge: no white outline on click, keyboard focus ring drawn inside the button", () => {
    const html = renderTabs("general");

    expect(html).not.toContain("focus:ring-white");
    expect(html).not.toContain("focus:ring ");
    expect(triggerOf(html, "General")).toContain("focus-visible:ring-inset");
  });

  it("failure: a tab with errors keeps a non-color indicator and an inset error ring", () => {
    const html = renderTabs("general", { magic: true });
    const magic = triggerOf(html, "Magic");

    expect(magic).toContain("ring-inset ring-red/80");
    expect(magic).toContain("data-invalid");
    expect(magic).toContain("This tab contains invalid fields");
  });
});
