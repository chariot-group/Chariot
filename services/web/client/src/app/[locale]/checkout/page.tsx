"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { useCheckout } from "@/hooks/useCheckout";
import Logo from "@public/logo.svg";

// Load Stripe outside render to avoid recreating the object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutContent() {
  const router = useRouter();
  const t = useTranslations("checkout");

  const {
    locale,
    product,
    productLoading,
    productError,
    clientSecret,
    piRefreshing,
    piError,
    pricing,
    tokenCount,
    quantity,
    quantitySyncPending,
    onQuantityChange,
    promoCode,
    referralDiscount,
  } = useCheckout();

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
          <div
            className="w-16"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-xl font-bold text-center text-card-foreground">{t("title")}</h1>

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

        {!productLoading && product && pricing.currency && (
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
                  <CheckoutForm
                    product={product}
                    tokenCount={tokenCount}
                    pricing={pricing}
                    promoCode={promoCode}
                    piRefreshing={piRefreshing}
                    locale={locale}
                    quantity={quantity}
                    quantitySyncPending={quantitySyncPending}
                    onQuantityChange={onQuantityChange}
                    referralDiscount={referralDiscount}
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
