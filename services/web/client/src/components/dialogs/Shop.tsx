"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Tag, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import paymentService, { ResolvedCode, StripeProduct } from "@/services/PaymentService";
import { useToast } from "@/hooks/useToast";
import ShopProductCard from "@/components/profile/ShopProductCard";

interface ShopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Shop({ open, onOpenChange }: ShopProps) {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<{ raw: string; resolved: ResolvedCode } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const tShop = useTranslations("shop");
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setCheckoutLoading(null);
      setCodeInput("");
      setAppliedCode(null);
      setCodeError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    paymentService
      .getProducts()
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const priceA = a.prices[0]?.unit_amount ?? 0;
          const priceB = b.prices[0]?.unit_amount ?? 0;
          return priceA - priceB;
        });
        setProducts(sorted);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setCheckoutLoading(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

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

  async function handleBuy(product: StripeProduct) {
    setCheckoutLoading(product.id);
    try {
      const promoCode = appliedCode?.resolved.type === "promo" ? appliedCode.raw : undefined;
      const affiliationCode = appliedCode?.resolved.type === "affiliation" ? appliedCode.raw : undefined;
      const checkoutUrl = await paymentService.createCheckoutSession(
        product.id,
        product.name,
        promoCode,
        affiliationCode,
      );
      window.location.href = checkoutUrl;
    } catch {
      toast.error(tShop("checkoutError"));
    } finally {
      setCheckoutLoading(null);
    }
  }

  function formatDiscount(resolved: ResolvedCode): string {
    if (resolved.discountType === "PERCENTAGE") {
      return `-${resolved.discountValue}%`;
    }
    return `-${(resolved.discountValue / 100).toFixed(2).replace(".", ",")} €`;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tShop("pageTitle")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{tShop("pageSubtitle")}</p>
        </DialogHeader>

        {/* Promo / affiliation code input */}
        <div className="space-y-2">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-medium">{appliedCode.raw}</span>
                <span className="text-muted-foreground"> {formatDiscount(appliedCode.resolved)}</span>
              </div>
              <button
                onClick={handleRemoveCode}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={tShop("removeCode")}>
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={codeInputRef}
                  className="pl-9 uppercase"
                  placeholder={tShop("codePlaceholder")}
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                  disabled={codeLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleApplyCode}
                disabled={!codeInput.trim() || codeLoading}>
                {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : tShop("applyCode")}
              </Button>
            </div>
          )}
          {codeError && <p className="text-xs text-destructive">{codeError}</p>}
        </div>

        {loading && (
          <div
            className="flex items-center justify-center gap-2 py-10 text-muted-foreground"
            role="status"
            aria-live="polite">
            <Loader2
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            <span>{tShop("loadingProducts")}</span>
          </div>
        )}

        {!loading && error && (
          <div
            className="flex flex-col items-center gap-3 py-10"
            role="alert">
            <p className="text-destructive text-sm">{tShop("errorProducts")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}>
              {tShop("close")}
            </Button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">{tShop("noProducts")}</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => {
              const unitAmount = product.prices[0]?.unit_amount ?? 0;
              const discountedUnitAmount = appliedCode
                ? appliedCode.resolved.discountType === "PERCENTAGE"
                  ? Math.max(0, unitAmount - Math.floor((unitAmount * appliedCode.resolved.discountValue) / 100))
                  : Math.max(0, unitAmount - appliedCode.resolved.discountValue)
                : undefined;
              return (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  isLoading={checkoutLoading === product.id}
                  disabled={!!checkoutLoading}
                  onBuy={handleBuy}
                  discountedUnitAmount={discountedUnitAmount}
                />
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
