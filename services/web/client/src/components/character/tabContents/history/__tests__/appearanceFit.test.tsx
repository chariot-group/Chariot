import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useForm, type FieldValues } from "react-hook-form";
import CharacterHistoryView from "@/components/character/tabContents/history/view/CharacterHistoryView";
import CharacterHistoryTabEdit from "@/components/character/tabContents/history/form/CharacterHistoryTabEdit";
import type { Character } from "@/types/character";

const createTestStore = () =>
  configureStore({
    reducer: {
      user: (state = { user: { preferredMeasurementUnit: "metric" }, loading: false, error: null, lastFetch: null }) =>
        state,
    },
  });

const messages = {
  characterDetail: {
    history: {
      appearance: "Appearance",
      eyes: "Eyes",
      age: "Age",
      skin: "Skin",
      height: "Height",
      weight: "Weight",
      hair: "Hair",
      alliesAndOrgs: "Allies and Organizations",
      bonds: "Bonds",
      description: "Description",
      personalityTraits: "Personality Traits",
      ideals: "Ideals",
      flaws: "Flaws",
      backstory: "Backstory",
    },
    battle: {
      sizes: { Medium: "Medium" },
      sizesAbbr: { Medium: "M" },
      feetAbbr: "ft",
    },
  },
};

const LONG_EYES =
  "Pale silver-blue irises with a thin gold ring and a faint scar across the left eyelid from a winter campaign";

const shortAppearance = {
  eyes: "Blue",
  age: 24,
  skin: "Fair",
  height: 6,
  weight: 180,
  hair: "Black",
};

const createCharacter = (appearance: Character["appearance"]): Character =>
  ({
    appearance,
    background: {
      personalityTraits: "A very long personality text that would stretch a neighboring card if appearance used h-full.",
    },
    stats: { size: "Medium" },
  }) as Character;

const appearanceCardOpenTag = (html: string) =>
  html.match(/<div[^>]*aria-labelledby="appearance-title"[^>]*>/)?.[0] ?? "";

const renderView = (character: Character) =>
  renderToStaticMarkup(
    <Provider store={createTestStore()}>
      <NextIntlClientProvider
        locale="en"
        timeZone="UTC"
        messages={messages}>
        <CharacterHistoryView
          character={character}
          accentColor="text-green"
        />
      </NextIntlClientProvider>
    </Provider>,
  );

function HistoryEditHarness({ appearance }: { appearance: Record<string, unknown> }) {
  const form = useForm<FieldValues>({
    defaultValues: { appearance },
  });

  return (
    <Provider store={createTestStore()}>
      <NextIntlClientProvider
        locale="en"
        timeZone="UTC"
        messages={messages}>
        <CharacterHistoryTabEdit
          accentColor="text-green"
          form={form}
        />
      </NextIntlClientProvider>
    </Provider>
  );
}

const renderEdit = (appearance: Record<string, unknown>) =>
  renderToStaticMarkup(<HistoryEditHarness appearance={appearance} />);

/** @see FR-character-history-appearance-fit: History Appearance Card Sizes to Content */
describe("FR-character-history-appearance-fit — CharacterHistoryView", () => {
  it("nominal: compact appearance card sizes to short field values", () => {
    const html = renderView(createCharacter(shortAppearance));
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain('aria-labelledby="appearance-title"');
    expect(html).toContain('id="appearance-title"');
    expect(html).toContain("Blue");
    expect(html).toContain("Black");
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
    expect(html).toContain("self-start");
    expect(html).toContain("items-start");
  });

  it("edge: a long wrapping appearance value stays fully readable without stretching siblings", () => {
    const html = renderView(createCharacter({ ...shortAppearance, eyes: LONG_EYES }));
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain(LONG_EYES);
    expect(html).not.toContain("truncate");
    expect(html).toContain("wrap-break-words");
    expect(html).toContain("items-start");
    expect(html).toContain("min-w-0");
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
  });

  it("failure: empty appearance values keep a compact labelled card", () => {
    const html = renderView(createCharacter({}));
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="appearance-title"');
    expect(html).toContain(">Appearance</h2>");
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
    expect(html).toContain("self-start");
  });
});

/** @see FR-character-history-appearance-fit: History Appearance Card Sizes to Content */
describe("FR-character-history-appearance-fit — CharacterHistoryTabEdit", () => {
  it("nominal: edit appearance card stays compact with single-line inputs", () => {
    const html = renderEdit(shortAppearance);
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain('id="appearance-eyes"');
    expect(html).toContain('id="appearance-age"');
    expect(html).toMatch(/<input[^>]*id="appearance-eyes"/);
    expect(html).not.toMatch(/<textarea[^>]*id="appearance-eyes"/);
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
    expect(html).toContain("self-start");
    expect(html).toContain("items-start");
  });

  it("edge: a long eyes value remains in a compact input without filling the card", () => {
    const html = renderEdit({ ...shortAppearance, eyes: LONG_EYES });
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain(LONG_EYES);
    expect(html).toMatch(/<input[^>]*id="appearance-eyes"/);
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
  });

  it("failure: empty edit appearance keeps a labelled compact card", () => {
    const html = renderEdit({});
    const cardTag = appearanceCardOpenTag(html);

    expect(html).toContain('aria-labelledby="appearance-title"');
    expect(html).toContain(">Appearance</h2>");
    expect(cardTag).toContain("h-fit");
    expect(cardTag).not.toContain("h-full");
  });
});
