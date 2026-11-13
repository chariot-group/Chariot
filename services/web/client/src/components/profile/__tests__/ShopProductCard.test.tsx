import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ShopProductCard from "@/components/profile/ShopProductCard";
import { StripeProduct } from "@/services/PaymentService";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/image", () => ({ default: () => <span data-testid="token-icon" /> }));

const noop = () => {};

const buildProduct = (overrides: Partial<StripeProduct> = {}): StripeProduct =>
  ({
    id: "prod_explorer",
    name: "explorerPack",
    description: "explorerDescription",
    active: true,
    metadata: { token_number: "5" },
    prices: [{ unit_amount: 799, currency: "eur" }],
    ...overrides,
  }) as StripeProduct;

/** @see docs/design.md §6.4 (overflow and text containment) */
describe("ShopProductCard", () => {
  it("nominal: price and wheel count never wrap and the price row can reflow", () => {
    const html = renderToStaticMarkup(
      <ShopProductCard
        product={buildProduct()}
        isLoading={false}
        disabled={false}
        onBuy={noop}
      />,
    );

    expect(html).toMatch(/7\.99.*EUR/);
    expect(html).toMatch(/class="[^"]*flex-wrap[^"]*"/);
    expect(html).toMatch(/class="[^"]*whitespace-nowrap[^"]*">7\.99/);
    expect(html).not.toContain("recommended");
  });

  it("edge: recommended pack shows a centred badge and is not a nested interactive element", () => {
    const html = renderToStaticMarkup(
      <ShopProductCard
        product={buildProduct({ metadata: { token_number: "15", type: "recommended" } })}
        isLoading={false}
        disabled={false}
        onBuy={noop}
      />,
    );

    expect(html).toContain("recommended");
    expect(html).toContain("left-1/2");
    expect(html).not.toContain('role="button"');
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it("failure: a product without price renders no amount but keeps the buy button", () => {
    const html = renderToStaticMarkup(
      <ShopProductCard
        product={buildProduct({ prices: [] })}
        isLoading={false}
        disabled={false}
        onBuy={noop}
      />,
    );

    expect(html).not.toContain("EUR");
    expect(html).toContain("buyButton");
  });
});
