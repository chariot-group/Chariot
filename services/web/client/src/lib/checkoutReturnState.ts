import type { CheckoutSessionStatus } from "@/services/PaymentService";

export type CheckoutReturnState = "loading" | "success" | "failure";

/** Stripe `redirect_status` values that mean the payment went through (or is being settled). */
const SUCCESS_REDIRECT_STATUSES = new Set(["succeeded", "processing"]);

/**
 * State of the checkout return page (FR-stripe-checkout — Checkout Outcomes).
 * Every settled state is either success or failure: the page is never left empty.
 * - PaymentElement flow: `redirect_status` decides (anything but succeeded / processing is a failure).
 * - Legacy Checkout Session flow: the session status fetched from the API decides.
 */
export function resolveCheckoutReturnState(input: {
  loading: boolean;
  error: boolean;
  redirectStatus: string | null;
  sessionStatus: CheckoutSessionStatus | null;
}): CheckoutReturnState {
  const { loading, error, redirectStatus, sessionStatus } = input;
  if (redirectStatus !== null) {
    return SUCCESS_REDIRECT_STATUSES.has(redirectStatus) ? "success" : "failure";
  }
  if (loading) return "loading";
  if (error) return "failure";
  return sessionStatus?.status === "complete" ? "success" : "failure";
}
