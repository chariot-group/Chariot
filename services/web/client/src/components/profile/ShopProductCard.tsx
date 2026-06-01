"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StripeProduct } from "@/services/PaymentService";
import { ArrowDown, ArrowUpRight, Coins, Loader2 } from "lucide-react";
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

  if (hasRecommend) {
    return (
      <Card
        tabIndex={0}
        role="button"
        className="relative bg-card text-card-foreground shadow-sm flex flex-col gap-3 p-4 rounded-[15px]">
        <Card className="absolute -top-3 -left-1 bg-primary px-2 py-1 flex flex-row items-center gap-1 rounded-full">
          <ArrowDown
            height={15}
            width={15}
          />
          <span className="text-white text-xs font-semibold">{tShop("recommended")}</span>
          <ArrowDown
            height={15}
            width={15}
          />
        </Card>
        <span className="font-semibold text-sm">{tShop(product.name)}</span>
        {product.description && <p className="text-xs text-muted-foreground">{tShop(product.description)}</p>}
        <div className="flex items-center justify-between mt-auto">
          {tokenCount !== null && (
            <span className="flex items-center gap-1 text-sm font-bold">
              {tokenCount}
              <Image
                src={Token}
                alt=""
                aria-hidden="true"
                className="w-4 h-4"
              />
            </span>
          )}
          {price && (
            <div className="flex flex-col items-end">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {((price.unit_amount ?? 0) / 100).toFixed(2)} {price.currency.toUpperCase()}
                </span>
              )}
              <span className={`text-sm font-semibold${hasDiscount ? " text-green-500" : ""}`}>
                {((hasDiscount ? discountedUnitAmount! : (price.unit_amount ?? 0)) / 100).toFixed(2)}{" "}
                {price.currency.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <Button
          className="rounded-2xl w-full text-sm mt-1"
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

  return (
    <Card className="flex flex-col gap-3 p-4 rounded-[15px]">
      <span className="font-semibold text-sm">{tShop(product.name)}</span>
      {product.description && <p className="text-xs text-muted-foreground">{tShop(product.description)}</p>}
      <div className="flex items-center justify-between mt-auto">
        {tokenCount !== null && (
          <span className="flex items-center gap-1 text-sm font-bold">
            {tokenCount}
            <Image
              src={Token}
              alt=""
              aria-hidden="true"
              className="w-4 h-4"
            />
          </span>
        )}
        {price && (
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {((price.unit_amount ?? 0) / 100).toFixed(2)} {price.currency.toUpperCase()}
              </span>
            )}
            <span className={`text-sm font-semibold${hasDiscount ? " text-green-500" : ""}`}>
              {((hasDiscount ? discountedUnitAmount! : (price.unit_amount ?? 0)) / 100).toFixed(2)}{" "}
              {price.currency.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <Button
        className="rounded-2xl w-full text-sm mt-1"
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
