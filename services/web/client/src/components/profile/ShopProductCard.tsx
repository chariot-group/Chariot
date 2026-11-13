"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StripeProduct } from "@/services/PaymentService";
import { ArrowDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Token from "@public/assets/token.svg";

interface ShopProductCardProps {
  product: StripeProduct;
  isLoading: boolean;
  disabled: boolean;
  onBuy: (product: StripeProduct) => void;
  discountedUnitAmount?: number;
}

export default function ShopProductCard({
  product,
  isLoading,
  disabled,
  onBuy,
  discountedUnitAmount,
}: ShopProductCardProps) {
  const tShop = useTranslations("shop");
  const price = product.prices[0];
  const tokenCount = product.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;
  const hasDiscount = discountedUnitAmount !== undefined && price && discountedUnitAmount < (price.unit_amount ?? 0);
  const hasRecommend = product.metadata?.type === "recommended";

  return (
    <Card className={`relative flex min-w-0 flex-col gap-3 p-4 rounded-[15px]${hasRecommend ? " pt-6" : ""}`}>
      {hasRecommend && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
          <ArrowDown
            height={15}
            width={15}
            aria-hidden="true"
          />
          {tShop("recommended")}
          <ArrowDown
            height={15}
            width={15}
            aria-hidden="true"
          />
        </span>
      )}
      <span className="font-semibold text-sm break-words">{tShop(product.name)}</span>
      {product.description && <p className="text-xs text-muted-foreground">{tShop(product.description)}</p>}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-auto">
        {tokenCount !== null && (
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold whitespace-nowrap">
            {tokenCount}
            <Image
              src={Token}
              alt=""
              aria-hidden="true"
              className="w-4 h-4 shrink-0"
            />
          </span>
        )}
        {price && (
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                {((price.unit_amount ?? 0) / 100).toFixed(2)} {price.currency.toUpperCase()}
              </span>
            )}
            <span className={`text-sm font-semibold whitespace-nowrap${hasDiscount ? " text-green-500" : ""}`}>
              {((hasDiscount ? discountedUnitAmount! : (price.unit_amount ?? 0)) / 100).toFixed(2)}{" "}
              {price.currency.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <Button
        className="w-full text-sm mt-1"
        disabled={disabled}
        onClick={() => onBuy(product)}
        aria-busy={isLoading}>
        {isLoading ? (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : (
          tShop("buyButton")
        )}
      </Button>
    </Card>
  );
}
