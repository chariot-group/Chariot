"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StripeProduct } from "@/services/PaymentService";
import { Coins, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Token from "@public/assets/token.svg";

interface ShopProductCardProps {
  product: StripeProduct;
  isLoading: boolean;
  disabled: boolean;
  onBuy: (product: StripeProduct) => void;
}

export default function ShopProductCard({ product, isLoading, disabled, onBuy }: ShopProductCardProps) {
  const tShop = useTranslations("shop");
  const price = product.prices[0];
  const tokenCount = product.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;

  return (
    <Card className="flex flex-col gap-3 p-4 rounded-[15px]">
      <div className="flex items-center gap-2">
        <Coins
          className="h-5 w-5 text-yellow-500"
          aria-hidden="true"
        />
        <span className="font-semibold text-sm">{product.name}</span>
      </div>
      {product.description && <p className="text-xs text-muted-foreground">{product.description}</p>}
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
          <span className="text-sm font-semibold">
            {((price.unit_amount ?? 0) / 100).toFixed(2)} {price.currency.toUpperCase()}
          </span>
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
