"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
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

// ─── inner component (uses useSearchParams, needs Suspense) ─────────────────

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

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

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

  // ── code management ─────────────────────────────────────────────────────
  async function handleApplyCode() {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const resolved = await paymentService.resolveCode(trimmed);
      setAppliedCode({ raw: trimmed, resolved });
      setCodeInput("");
    } catch {
      setCodeError(tShop("codeNotFound"));
    } finally {
      setCodeLoading(false);
    }
  }

  function handleRemoveCode() {
    setAppliedCode(null);
    setCodeError(null);
    setTimeout(() => codeInputRef.current?.focus(), 50);
  }

  // ── pricing calculation ─────────────────────────────────────────────────
  const price = product?.prices[0];
  const originalAmount = price?.unit_amount ?? 0;
  const discountedAmount =
    appliedCode && originalAmount > 0 ? computeDiscountedAmount(originalAmount, appliedCode.resolved) : originalAmount;
  const discountAmount = originalAmount - discountedAmount;
  const tokenCount = product?.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;

  // ── pay ─────────────────────────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    if (!product || !price) return;
    setPayLoading(true);
    setPayError(null);
    try {
      const promoCode = appliedCode?.resolved.type === "promo" ? appliedCode.raw : undefined;
      const affiliationCode = appliedCode?.resolved.type === "affiliation" ? appliedCode.raw : undefined;

      const secret = await paymentService.createEmbeddedCheckoutSession(
        product.id,
        displayName || product.name,
        locale,
        promoCode,
        affiliationCode,
      );
      setClientSecret(secret);
    } catch {
      setPayError(t("payError"));
    } finally {
      setPayLoading(false);
    }
  }, [appliedCode, displayName, locale, price, product, t]);

  // ── render ───────────────────────────────────────────────────────────────

  // Phase 2: Stripe Embedded Checkout is active
  if (clientSecret) {
    const options = { clientSecret };
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0c] bg-[url('/background.svg')] bg-cover bg-fixed bg-center bg-no-repeat overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src={Logo}
              alt="Chariot"
              width={70}
              height={70}
              className="w-16 h-16"
              priority
            />
          </div>

          {/* Pack recap */}
          {product && price && (
            <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-card/60 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <Coins
                  className="h-4 w-4 text-yellow-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium">{product.name}</span>
                {tokenCount !== null && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    — {tokenCount}
                    <Image
                      src={Token}
                      alt=""
                      aria-hidden="true"
                      className="w-3.5 h-3.5"
                    />
                  </span>
                )}
              </div>
              <span className="font-semibold text-primary">{formatPrice(discountedAmount, price.currency)}</span>
            </div>
          )}

          {/* Embedded Stripe form */}
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  // Phase 1: Order summary + code input + pay button
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0c] bg-[url('/background.svg')] bg-cover bg-fixed bg-center bg-no-repeat overflow-y-auto">
      <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
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

        {/* Product loading / error */}
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
          <>
            {/* Order summary card */}
            <Card className="gap-4 p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("orderSummary")}
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Coins
                    className="h-6 w-6 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                  )}
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

            {/* Code input */}
            <Card className="gap-3 p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("promoTitle")}
              </h2>
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
                    onClick={handleRemoveCode}
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
                      onChange={(e) => {
                        setCodeInput(e.target.value.toUpperCase());
                        setCodeError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                      disabled={codeLoading}
                      aria-label={tShop("codePlaceholder")}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyCode}
                    disabled={!codeInput.trim() || codeLoading}
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
              onClick={handlePay}
              disabled={payLoading}
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
          </>
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
