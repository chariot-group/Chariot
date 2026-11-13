import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NameLabelField } from "@/components/dialogs/NameLabelField";
import { NAME_LABEL_MAX_LENGTH } from "@/lib/nameLabel";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const render = (value: string, serverError = false) =>
  renderToStaticMarkup(
    <NameLabelField
      id="group-name"
      label="Group name"
      value={value}
      onChange={() => {}}
      serverError={serverError}
    />,
  );

/** @see FR-form-field-validation (Group and campaign names) */
describe("NameLabelField", () => {
  it("nominal: a 50-character name shows 50/50, linked to the input, without error", () => {
    const html = render("a".repeat(NAME_LABEL_MAX_LENGTH));
    expect(html).toContain(`>50/${NAME_LABEL_MAX_LENGTH}`);
    expect(html).toContain('aria-describedby="group-name-counter"');
    expect(html).not.toContain('aria-invalid="');
    expect(html).not.toContain("tooLong");
  });

  it("edge: a 51-character name is kept as typed, marked invalid and explained", () => {
    const name = "a".repeat(NAME_LABEL_MAX_LENGTH + 1);
    const html = render(name);
    expect(html).toContain(`value="${name}"`);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="group-name-error group-name-counter"');
    expect(html).toContain('id="group-name-error"');
    expect(html).toContain("tooLong");
    expect(html).toContain('role="alert"');
  });

  it("failure: an API rejection shows the field error even for a short name", () => {
    const html = render("Short", true);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("tooLong");
  });
});
