"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import paymentService, { StripeProduct } from "@/services/PaymentService";
import ShopProductCard from "@/components/profile/ShopProductCard";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface ShopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Shop({ open, onOpenChange }: ShopProps) {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const tShop = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  useEffect(() => {
    if (!open) {
      setLoading(false);
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

  function handleBuy(product: StripeProduct) {
    onOpenChange(false);
    const params = new URLSearchParams({
      packId: product.id,
      displayName: product.name,
    });
    router.push(`/${locale}/checkout?${params.toString()}`);
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
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              {products
                .filter((product) => {
                  const tokenPrice = product.metadata?.token_number
                    ? parseInt(product.metadata.token_number, 10)
                    : null;
                  return tokenPrice !== null && tokenPrice > 1;
                })
                .map((product) => (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    isLoading={false}
                    disabled={false}
                    onBuy={handleBuy}
                  />
                ))}
            </div>
            {products
              .filter((product) => {
                const tokenPrice = product.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;
                return tokenPrice !== null && tokenPrice === 1;
              })
              .map((product) => (
                <Button
                  key={product.id}
                  className="w-fit self-end"
                  variant="link"
                  onClick={() => handleBuy(product)}>
                  {tShop("payPerUnit", { price: ((product.prices[0]?.unit_amount ?? 0) / 100).toFixed(2) })}
                </Button>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
