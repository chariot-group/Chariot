"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import paymentService, { StripeProduct } from "@/services/PaymentService";
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
  const tShop = useTranslations("shop");
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setCheckoutLoading(null);
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

  async function handleBuy(product: StripeProduct) {
    setCheckoutLoading(product.id);
    try {
      const checkoutUrl = await paymentService.createCheckoutSession(product.id, product.name);
      window.location.href = checkoutUrl;
    } catch {
      toast.error(tShop("checkoutError"));
      setCheckoutLoading(null);
    }
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
            {products.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                isLoading={checkoutLoading === product.id}
                disabled={!!checkoutLoading}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
