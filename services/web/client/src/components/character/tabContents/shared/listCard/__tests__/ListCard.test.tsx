import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "@/components/ui/accordion";
import ListCard from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";

const renderList = (
  rows: Array<{ name: string; meta?: string[]; hasError?: boolean; open?: boolean }>,
  options: { bounded?: boolean; boundedClassName?: string } = {},
) =>
  renderToStaticMarkup(
    <ListCard
      headingId="list-heading"
      title="Actions"
      count={rows.length}
      accentColor="text-red"
      expanded={false}
      onToggleAll={vi.fn()}
      expandLabel="Expand all"
      collapseLabel="Collapse all"
      emptyLabel="No actions"
      actions={<button type="button">Add</button>}
      {...options}>
      <Accordion
        type="multiple"
        value={rows.filter((row) => row.open).map((row) => row.name)}>
        {rows.map((row) => (
          <ListRow
            key={row.name}
            value={row.name}
            name={row.name}
            meta={row.meta}
            triggerLabel={`Details ${row.name}`}
            isOpen={Boolean(row.open)}
            hasError={row.hasError}
            trailing={<button aria-label={`Delete ${row.name}`}>x</button>}>
            <p>Details of {row.name}</p>
          </ListRow>
        ))}
      </Accordion>
    </ListCard>,
  );

/** @see FR-character-list-card */
describe("ListCard / ListRow", () => {
  it("nominal: one card labelled by its heading, rows are plain lines with a muted summary (no nested card)", () => {
    const html = renderList([
      { name: "Scimitar", meta: ["Action", "+4", "1d6 slashing"] },
      { name: "Shortbow", meta: ["Action", "+4", "1d6 piercing"] },
    ]);

    expect(html.match(/data-slot="card"/g)).toHaveLength(1);
    expect(html).toContain('role="region" aria-labelledby="list-heading"');
    expect(html.match(/data-slot="accordion-item"/g)).toHaveLength(2);
    expect(html).toMatch(/Action<\/span>[\s\S]*·[\s\S]*\+4<\/span>[\s\S]*·[\s\S]*1d6 slashing<\/span>/);
    expect(html).toContain('aria-label="Delete Scimitar"');
  });

  it("edge: an empty list keeps its header and controls and shows the empty-state line", () => {
    const html = renderList([]);

    expect(html).toContain('id="list-heading"');
    expect(html).toContain(">Add</button>");
    expect(html).toContain("No actions");
    expect(html).not.toContain('data-slot="accordion-item"');
    expect(html).toMatch(/aria-label="Expand all"[^>]*disabled|disabled[^>]*aria-label="Expand all"/);
  });

  it("edge: bounded rows scroll inside the card while the header stays outside; edit mode uses a taller cap", () => {
    const bounded = renderList([{ name: "Scimitar" }], { bounded: true });
    const scrollAt = bounded.indexOf("overflow-y-auto");

    expect(scrollAt).toBeGreaterThan(bounded.indexOf('id="list-heading"'));
    expect(bounded.slice(scrollAt)).toContain("Scimitar");
    const edit = renderList([{ name: "Scimitar" }], { bounded: true, boundedClassName: "max-h-[min(40rem,70dvh)]" });
    expect(edit).toContain("max-h-[min(40rem,70dvh)]");
    expect(edit).not.toContain("max-h-[28rem]");
  });

  it("failure: an invalid row is outlined with the destructive ring", () => {
    const html = renderList([{ name: "Broken", hasError: true }, { name: "Fine" }]);
    const items = html.match(/<div[^>]*data-slot="accordion-item"[^>]*>/g) ?? [];

    expect(items[0]).toContain("ring-destructive");
    expect(items[1]).not.toContain("ring-destructive");
  });
});
