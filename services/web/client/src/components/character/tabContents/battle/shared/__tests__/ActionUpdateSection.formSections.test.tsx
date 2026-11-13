import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { useFieldArray, useForm, type FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";

vi.mock("@/store/hooks", () => ({ useAppSelector: () => undefined, useAppDispatch: () => vi.fn() }));
vi.mock("@/components/ui/damage-type-input", () => ({ DamageTypeInput: () => null }));
// Render the first row expanded: the accordion state is internal to the component.
vi.mock("radix-ui", async (orig) => {
  const { createElement } = await import("react");
  const mod = (await orig()) as Record<string, unknown> & { Accordion: Record<string, never> };
  return {
    ...mod,
    Accordion: {
      ...mod.Accordion,
      Root: (props: Record<string, unknown>) => createElement(mod.Accordion.Root, { ...props, value: ["action-0"] }),
    },
  };
});

const actions = [
  {
    name: "Scimitar",
    usageType: "action",
    attackBonus: 4,
    damage: [
      { dice: "1d6", type: "slashing" },
      { dice: "1d4", type: "fire" },
    ],
    range: "5",
    description: "A curved blade.",
  },
];

function Harness() {
  const form = useForm<FieldValues>({ defaultValues: { actions } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "actions" });
  return (
    <ActionUpdateSection
      title="Actions"
      form={form}
      fieldArrayName="actions"
      fields={fields}
      append={append}
      remove={remove}
      accentColor="text-red"
    />
  );
}

const render = () =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}>
      <Harness />
    </NextIntlClientProvider>,
  );

/** @see FR-character-list-card — edit form hierarchy */
describe("ActionUpdateSection — expanded row form sections", () => {
  it("nominal: the open row form reads General → Attack → Damage → Description", () => {
    const html = render();
    const titles = [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);

    expect(titles).toEqual([
      "formSections.general",
      "formSections.attack",
      "formSections.damage",
      "formSections.description",
    ]);
    expect(html).toContain("attackSuggestions");
  });

  it("edge: damage column labels are visible on every entry", () => {
    const html = render();
    const diceLabels = [...html.matchAll(/<label[^>]*for="[^"]*-damage-\d-dice"[^>]*>/g)].map((match) => match[0]);

    expect(diceLabels).toHaveLength(2);
    expect(diceLabels[0]).not.toContain("sr-only");
    expect(diceLabels[1]).not.toContain("sr-only");
  });

  it("failure: the item count is a decorative badge, the heading keeps the list title", () => {
    const html = render();
    const heading = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "";

    expect(heading).toContain("Actions");
    expect(heading).toMatch(/<span aria-hidden="true"[^>]*>1<\/span>|<span[^>]*aria-hidden="true">1<\/span>/);
  });

  it("edge: the long-range control is a labelled text button under the range field (FR-character-action-dual-range)", () => {
    const html = render();
    const button = html.match(/<button[^>]*>(?:(?!<\/button>)[\s\S])*addLongRange<\/button>/)?.[0];

    expect(button).toBeDefined();
    expect(button).not.toContain("aria-label=");
  });
});
