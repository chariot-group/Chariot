import { describe, expect, it } from "vitest";
import { resolveCheckoutReturnState } from "@/lib/checkoutReturnState";

const settled = { loading: false, error: false, redirectStatus: null, sessionStatus: null };

describe("resolveCheckoutReturnState", () => {
  it("returns success for redirect_status=succeeded", () => {
    expect(resolveCheckoutReturnState({ ...settled, redirectStatus: "succeeded" })).toBe("success");
  });

  it("returns success for redirect_status=processing", () => {
    expect(resolveCheckoutReturnState({ ...settled, redirectStatus: "processing" })).toBe("success");
  });

  it("returns failure for redirect_status=failed instead of an empty page", () => {
    expect(resolveCheckoutReturnState({ ...settled, redirectStatus: "failed" })).toBe("failure");
  });

  it("returns failure for an unknown redirect_status", () => {
    expect(resolveCheckoutReturnState({ ...settled, redirectStatus: "requires_payment_method" })).toBe("failure");
  });

  it("returns loading while the legacy session status is fetched", () => {
    expect(resolveCheckoutReturnState({ ...settled, loading: true })).toBe("loading");
  });

  it("returns success for a complete legacy session", () => {
    expect(
      resolveCheckoutReturnState({ ...settled, sessionStatus: { status: "complete", paymentStatus: "paid" } }),
    ).toBe("success");
  });

  it("returns failure for an open legacy session", () => {
    expect(resolveCheckoutReturnState({ ...settled, sessionStatus: { status: "open", paymentStatus: "unpaid" } })).toBe(
      "failure",
    );
  });

  it("returns failure when the status could not be fetched", () => {
    expect(resolveCheckoutReturnState({ ...settled, error: true })).toBe("failure");
  });
});
