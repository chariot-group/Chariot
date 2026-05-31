"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowLeft, CheckCircle2, Coins, Loader2, Tag, XCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import paymentService, { ResolvedCode, StripeProduct } from "@/services/PaymentService";
import Token from "@public/assets/token.svg";
import Logo from "@public/logo.svg";

// Load Stripe outside render to avoid recreating the object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── helpers ────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`;
}

function formatDiscount(resolved: ResolvedCode): string {
  if (resolved.discountType === "PERCENTAGE") return `-${resolved.discountValue} %`;
  return `-${(resolved.discountValue / 100).toFixed(2).replace(".", ",")} €`;
}

function computeDiscountedAmount(originalAmount: number, resolved: ResolvedCode): number {
  if (resolved.discountType === "PERCENTAGE") {
    return Math.max(0, originalAmount - Math.floor((originalAmount * resolved.discountValue) / 100));
  }
  return Math.max(0, originalAmount - resolved.discountValue);
}

// ─── inner form (must be inside <Elements>) ─────────────────────────────────

interface InnerFormProps {
  product: StripeProduct;
  price: { unit_amount: number | null; currency: string };
  tokenCount: number | null;
  originalAmount: number;
  discountedAmount: number;
  discountAmount: number;
  appliedCode: { raw: string; resolved: ResolvedCode } | null;
  codeInput: string;
  codeLoading: boolean;
  codeError: string | null;
  piRefreshing: boolean;
  onCodeInputChange: (value: string) => void;
  onApplyCode: () => void;
  onRemoveCode: () => void;
  codeInputRef: React.RefObject<HTMLInputElement | null>;
  locale: string;
}

function InnerCheckoutForm({
  product,
  price,
  tokenCount,
  originalAmount,
  discountedAmount,
  discountAmount,
  appliedCode,
  codeInput,
  codeLoading,
  codeError,
  piRefreshing,
  onCodeInputChange,
  onApplyCode,
  onRemoveCode,
  codeInputRef,
  locale,
}: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("checkout");
  const tShop = useTranslations("shop");

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function handleConfirmPayment() {
    if (!stripe || !elements) return;
    setPayLoading(true);
    setPayError(null);

    const returnUrl = `${window.location.origin}/${locale}/checkout/return`;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (result.error) {
      setPayError(result.error.message ?? t("payError"));
      setPayLoading(false);
    } else {
      // Payment succeeded without redirect (no 3DS)
      router.push(`/${locale}/checkout/return?redirect_status=succeeded`);
    }
  }

  return (
    <div className="flex flex-row gap-6 items-start w-full justify-center h-full">
      {/* Payment details */}
      <div className="w-[50%] overflow-y-auto self-stretch scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Card className="gap-3 p-5 ">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("paymentDetails")}
          </h2>
          {piRefreshing ? (
            <div className="flex justify-center py-4">
              <Loader2
                className="h-5 w-5 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
          ) : (
            <PaymentElement
              options={{
                paymentMethodOrder: ["card"],
                layout: { type: "accordion", defaultCollapsed: false },
              }}
            />
          )}
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        {/* Order summary */}
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
              <p className="font-semibold text-card-foreground truncate">{product.name}</p>
              {product.description && <p className="text-xs text-muted-foreground truncate">{product.description}</p>}
            </div>
            {tokenCount !== null && (
              <span className="flex items-center gap-1 text-sm font-bold text-card-foreground shrink-0">
                {tokenCount}
                <Image
                  src={Token}
                  alt={`${tokenCount} tokens`}
                  className="w-4 h-4"
                />
              </span>
            )}
          </div>

          {/* Price breakdown */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(originalAmount, price.currency)}</span>
            </div>
            {discountAmount > 0 && appliedCode && (
              <div className="flex justify-between text-sm text-green-500">
                <span>
                  {t("discount")} ({appliedCode.raw})
                </span>
                <span>-{formatPrice(discountAmount, price.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-card-foreground pt-1 border-t border-border/40">
              <span>{t("total")}</span>
              <span className={discountAmount > 0 ? "text-green-400" : ""}>
                {formatPrice(discountedAmount, price.currency)}
              </span>
            </div>
          </div>
        </Card>

        {/* Promo code */}
        <Card className="gap-3 p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("promoTitle")}</h2>
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-green-500 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium text-card-foreground">{appliedCode.raw}</span>
                <span className="text-green-400">{formatDiscount(appliedCode.resolved)}</span>
              </div>
              <button
                onClick={onRemoveCode}
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
                  ref={codeInputRef}
                  className="pl-9 uppercase bg-background/60"
                  placeholder={tShop("codePlaceholder")}
                  value={codeInput}
                  onChange={(e) => onCodeInputChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && onApplyCode()}
                  disabled={codeLoading || piRefreshing}
                  aria-label={tShop("codePlaceholder")}
                />
              </div>
              <Button
                variant="outline"
                onClick={onApplyCode}
                disabled={!codeInput.trim() || codeLoading || piRefreshing}
                aria-label={tShop("applyCode")}>
                {codeLoading ? (
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
          {codeError && (
            <p
              className="text-xs text-destructive"
              role="alert">
              {codeError}
            </p>
          )}
        </Card>

        {/* Pay button */}
        {payError && (
          <p
            className="text-sm text-destructive text-center"
            role="alert">
            {payError}
          </p>
        )}
        <Button
          size="lg"
          className="w-full rounded-2xl font-semibold text-base h-14"
          onClick={handleConfirmPayment}
          disabled={payLoading || piRefreshing || !stripe || !elements}
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
            t("payButton", { amount: formatPrice(discountedAmount, price.currency) })
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">{t("securedByStripe")}</p>
      </div>
    </div>
  );
}

// ─── main checkout content ───────────────────────────────────────────────────

function CheckoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "fr";
  const t = useTranslations("checkout");
  const tShop = useTranslations("shop");

  const packId = searchParams.get("packId") ?? "";
  const displayName = searchParams.get("displayName") ?? "";

  // Product state
  const [product, setProduct] = useState<StripeProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState(false);

  // Code state
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<{ raw: string; resolved: ResolvedCode } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // PaymentIntent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piRefreshing, setPiRefreshing] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);

  // ── load product ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!packId) {
      setProductError(true);
      setProductLoading(false);
      return;
    }
    let cancelled = false;
    paymentService
      .getProducts()
      .then((products) => {
        if (cancelled) return;
        const found = products.find((p) => p.id === packId) ?? null;
        if (!found) setProductError(true);
        else setProduct(found);
      })
      .catch(() => {
        if (!cancelled) setProductError(true);
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  // ── create / refresh PaymentIntent ─────────────────────────────────────
  const refreshPaymentIntent = useCallback(
    async (promoCode?: string, affiliationCode?: string) => {
      if (!product) return;
      setPiRefreshing(true);
      setPiError(null);
      try {
        const result = await paymentService.createPaymentIntent(
          packId,
          displayName || product.name,
          promoCode,
          affiliationCode,
        );
        setClientSecret(result.clientSecret);
      } catch {
        setPiError(t("payError"));
      } finally {
        setPiRefreshing(false);
      }
    },
    [packId, displayName, product, t],
  );

  useEffect(() => {
    if (product) {
      void refreshPaymentIntent();
    }
  }, [product, refreshPaymentIntent]);

  // ── code management ─────────────────────────────────────────────────────
  async function handleApplyCode() {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) return;

    setCodeLoading(true);
    setCodeError(null);

    let resolved: ResolvedCode;
    try {
      resolved = await paymentService.resolveCode(trimmed);
    } catch {
      setCodeError(tShop("codeNotFound"));
      setCodeLoading(false);
      return;
    }

    const promoCode = resolved.type === "promo" ? trimmed : undefined;
    const affiliationCode = resolved.type === "affiliation" ? trimmed : undefined;

    setAppliedCode({ raw: trimmed, resolved });
    setCodeInput("");
    setCodeLoading(false);

    void refreshPaymentIntent(promoCode, affiliationCode);
  }

  function handleRemoveCode() {
    setAppliedCode(null);
    setCodeError(null);
    void refreshPaymentIntent();
    setTimeout(() => codeInputRef.current?.focus(), 50);
  }

  // ── pricing calculation ─────────────────────────────────────────────────
  const price = product?.prices[0];
  const originalAmount = price?.unit_amount ?? 0;
  const discountedAmount =
    appliedCode && originalAmount > 0 ? computeDiscountedAmount(originalAmount, appliedCode.resolved) : originalAmount;
  const discountAmount = originalAmount - discountedAmount;
  const tokenCount = product?.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0c] bg-[url('/background.svg')] bg-cover bg-fixed bg-center bg-no-repeat overflow-hidden">
      <div className="w-full mx-auto px-4 py-6 flex flex-col gap-6 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t("back")}
          </Button>
          <Image
            src={Logo}
            alt="Chariot"
            width={56}
            height={56}
            className="w-12 h-12"
            priority
          />
          {/* spacer */}
          <div
            className="w-16"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-xl font-bold text-center text-card-foreground">{t("title")}</h1>

        {/* Product loading */}
        {productLoading && (
          <div className="flex justify-center py-10">
            <Loader2
              className="h-6 w-6 animate-spin text-primary"
              aria-label={t("loading")}
            />
          </div>
        )}

        {!productLoading && productError && (
          <div
            className="text-center text-destructive text-sm py-10"
            role="alert">
            {t("productError")}
          </div>
        )}

        {!productLoading && product && price && (
          <div className="flex-1 min-h-0 flex flex-col gap-6">
            {piError && (
              <p
                className="text-sm text-destructive text-center"
                role="alert">
                {piError}
              </p>
            )}

            {!clientSecret ? (
              <div className="flex justify-center py-10">
                <Loader2
                  className="h-6 w-6 animate-spin text-primary"
                  aria-label={t("loading")}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <Elements
                  key={clientSecret}
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: { theme: "night" },
                    locale: locale as import("@stripe/stripe-js").StripeElementLocale,
                  }}>
                  <InnerCheckoutForm
                    product={product}
                    price={price}
                    tokenCount={tokenCount}
                    originalAmount={originalAmount}
                    discountedAmount={discountedAmount}
                    discountAmount={discountAmount}
                    appliedCode={appliedCode}
                    codeInput={codeInput}
                    codeLoading={codeLoading}
                    codeError={codeError}
                    piRefreshing={piRefreshing}
                    onCodeInputChange={(v) => {
                      setCodeInput(v);
                      setCodeError(null);
                    }}
                    onApplyCode={handleApplyCode}
                    onRemoveCode={handleRemoveCode}
                    codeInputRef={codeInputRef}
                    locale={locale}
                  />
                </Elements>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── page export with Suspense boundary ─────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0c0c]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
      <CheckoutContent />
    </Suspense>
  );
}
