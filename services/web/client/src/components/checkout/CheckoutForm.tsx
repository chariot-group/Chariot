import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CheckCircle2, Coins, Loader2, Minus, Plus, Tag, XCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ResolvedCode, StripeProduct } from "@/services/PaymentService";
import { formatDiscount, formatPrice } from "@/lib/checkout-utils";
import Token from "@public/assets/token.svg";
import type { ReferralDiscount } from "@/hooks/useCheckout";

export interface PricingContext {
  originalAmount: number;
  discountedAmount: number;
  discountAmount: number;
  giftAmount: number;
  chargeableAmount: number;
  currency: string;
}

export interface PromoCodeState {
  input: string;
  loading: boolean;
  error: string | null;
  applied: { raw: string; resolved: ResolvedCode } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}

export interface CheckoutFormProps {
  product: StripeProduct;
  tokenCount: number | null;
  pricing: PricingContext;
  promoCode: PromoCodeState;
  piRefreshing: boolean;
  locale: string;
  quantity: number;
  quantitySyncPending: boolean;
  onQuantityChange: (quantity: number) => void;
  referralDiscount: ReferralDiscount | null;
  isFreeOrder: boolean;
  piError: string | null;
  onConfirmFreeOrder: () => Promise<void>;
}

interface CheckoutFormContentProps extends CheckoutFormProps {
  onConfirm: () => void;
  confirmDisabled: boolean;
  confirmLabel: string;
  showPaymentPanel: boolean;
}

function CheckoutFormContent({
  product,
  tokenCount,
  pricing,
  promoCode,
  piRefreshing,
  quantity,
  onQuantityChange,
  referralDiscount,
  piError,
  onConfirm,
  confirmDisabled,
  confirmLabel,
  showPaymentPanel,
}: CheckoutFormContentProps) {
  const t = useTranslations("checkout");
  const tShop = useTranslations("shop");

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const { originalAmount, discountAmount, giftAmount, chargeableAmount, currency } = pricing;

  async function handleConfirm() {
    setPayLoading(true);
    setPayError(null);
    try {
      await onConfirm();
    } catch {
      setPayError(t("payError"));
      setPayLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full md:flex-row md:items-start md:justify-center md:h-full">
      {showPaymentPanel && (
        <div className="w-full order-1 md:w-[50%] md:overflow-y-auto md:self-stretch scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <Card className="gap-3 p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("paymentDetails")}
            </h2>
            <PaymentElement
              options={{
                paymentMethodOrder: ["card"],
                layout: { type: "accordion", defaultCollapsed: false },
              }}
            />
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-6 w-full order-2 md:w-auto md:min-w-[340px]">
        <Card className="gap-4 p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("orderSummary")}</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Coins
                className="h-6 w-6 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground truncate">{tShop(product.name)}</p>
              {product.description && (
                <p className="text-xs text-muted-foreground truncate">{tShop(product.description)}</p>
              )}
            </div>
            {tokenCount !== null && (
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="flex items-center gap-1 text-sm font-bold text-card-foreground">
                  {tokenCount * quantity}
                  <Image
                    src={Token}
                    alt={`${tokenCount * quantity} tokens`}
                    className="w-4 h-4"
                  />
                </span>
                <span
                  className={`flex items-center gap-1 text-xs text-muted-foreground ${quantity <= 1 ? "invisible" : ""}`}
                  aria-hidden={quantity <= 1}>
                  {tokenCount}
                  <Image
                    src={Token}
                    alt={`${tokenCount} tokens`}
                    className="w-3 h-3 opacity-60"
                  />
                  <span>/ {t("pack")}</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted-foreground">{t("quantity")}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label={t("quantityDecrement")}>
                <Minus
                  className="h-4 w-4 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
              </button>
              <span
                className="min-w-6 px-1 text-center text-sm font-semibold tabular-nums text-card-foreground"
                aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                aria-label={t("quantityIncrement")}>
                <Plus
                  className="h-4 w-4 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div
              className={`flex justify-between text-sm text-muted-foreground ${quantity <= 1 ? "invisible" : ""}`}
              aria-hidden={quantity <= 1}>
              <span>{t("unitPrice")}</span>
              <span>{formatPrice(chargeableAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {t("subtotal")}
                <span
                  className={quantity <= 1 ? "invisible" : ""}
                  aria-hidden={quantity <= 1}>
                  {` ×${quantity}`}
                </span>
              </span>
              <span>{formatPrice(originalAmount * quantity, currency)}</span>
            </div>
            {discountAmount > 0 && (promoCode.applied || referralDiscount) && (
              <div className="flex justify-between text-sm text-green-500">
                <span>{promoCode.applied ? `${t("discount")} (${promoCode.applied.raw})` : t("referralDiscount")}</span>
                <span>-{formatPrice(discountAmount * quantity, currency)}</span>
              </div>
            )}
            {giftAmount > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>{t("giftDiscount")}</span>
                <span>-{formatPrice(giftAmount * quantity, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-card-foreground pt-1 border-t border-border/40">
              <span>{t("total")}</span>
              <span className={discountAmount > 0 || giftAmount > 0 ? "text-green-400" : ""}>
                {formatPrice(chargeableAmount * quantity, currency)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="gap-3 p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("promoTitle")}</h2>
          {referralDiscount && !promoCode.applied && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
              <CheckCircle2
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-card-foreground">{t("referralDiscount")}</span>
              <span className="text-green-400">-{referralDiscount.discountPercent} %</span>
            </div>
          )}
          {promoCode.applied ? (
            <div className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-green-500 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium text-card-foreground">{promoCode.applied.raw}</span>
                <span className="text-green-400">{formatDiscount(promoCode.applied.resolved)}</span>
              </div>
              <button
                onClick={promoCode.onRemove}
                disabled={piRefreshing}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={tShop("removeCode")}>
                <XCircle
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  ref={promoCode.inputRef}
                  className="pl-9 uppercase bg-background/60"
                  placeholder={tShop("codePlaceholder")}
                  value={promoCode.input}
                  onChange={(e) => promoCode.onChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && promoCode.onApply()}
                  disabled={promoCode.loading || piRefreshing || !!referralDiscount}
                  aria-label={tShop("codePlaceholder")}
                />
              </div>
              <Button
                variant="outline"
                onClick={promoCode.onApply}
                disabled={!promoCode.input.trim() || promoCode.loading || piRefreshing || !!referralDiscount}
                aria-label={tShop("applyCode")}>
                {promoCode.loading ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  tShop("applyCode")
                )}
              </Button>
            </div>
          )}
          {referralDiscount && !promoCode.applied && (
            <p className="text-xs text-muted-foreground">{t("referralNotCumulable")}</p>
          )}
          {promoCode.error && (
            <p
              className="text-xs text-destructive"
              role="alert">
              {promoCode.error}
            </p>
          )}
        </Card>

        {(payError || piError) && (
          <p
            className="text-sm text-destructive text-center"
            role="alert">
            {payError ?? piError}
          </p>
        )}
        <Button
          size="lg"
          className="w-full rounded-2xl font-semibold text-base h-14"
          onClick={handleConfirm}
          disabled={payLoading || confirmDisabled}
          aria-busy={payLoading}>
          {payLoading ? (
            <>
              <Loader2
                className="mr-2 h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              {t("preparing")}
            </>
          ) : (
            confirmLabel
          )}
        </Button>

        {!showPaymentPanel && <p className="text-center text-xs text-muted-foreground">{t("freeOrderNotice")}</p>}
        {showPaymentPanel && <p className="text-center text-xs text-muted-foreground">{t("securedByStripe")}</p>}
      </div>
    </div>
  );
}

/** Free checkout — no Stripe Elements context required. */
export function CheckoutFreeForm(props: CheckoutFormProps) {
  const router = useRouter();
  const t = useTranslations("checkout");
  const { locale, onConfirmFreeOrder, piRefreshing, quantitySyncPending, piError } = props;

  return (
    <CheckoutFormContent
      {...props}
      showPaymentPanel={false}
      confirmLabel={t("freeOrderButton")}
      confirmDisabled={piRefreshing || quantitySyncPending || !!piError}
      onConfirm={async () => {
        await onConfirmFreeOrder();
        router.push(`/${locale}/checkout/return?redirect_status=succeeded`);
      }}
    />
  );
}

/** Paid checkout — must be rendered inside <Elements>. */
export function CheckoutPaidForm(props: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("checkout");
  const { locale, piRefreshing, quantitySyncPending, piError, pricing, quantity } = props;
  const { chargeableAmount, currency } = pricing;

  return (
    <CheckoutFormContent
      {...props}
      showPaymentPanel
      confirmLabel={t("payButton", { amount: formatPrice(chargeableAmount * quantity, currency) })}
      confirmDisabled={piRefreshing || quantitySyncPending || !!piError || !stripe || !elements}
      onConfirm={async () => {
        if (!stripe || !elements) {
          throw new Error("Stripe not ready");
        }
        const returnUrl = `${window.location.origin}/${locale}/checkout/return`;
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });
        if (result.error) {
          throw new Error(result.error.message ?? t("payError"));
        }
        router.push(`/${locale}/checkout/return?redirect_status=succeeded`);
      }}
    />
  );
}
