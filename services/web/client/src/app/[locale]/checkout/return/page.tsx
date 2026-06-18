"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import paymentService, { CheckoutSessionStatus } from "@/services/PaymentService";
import Logo from "@public/logo.svg";

function ReturnContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "fr";
  const t = useTranslations("checkout");

  const redirectStatus = searchParams.get("redirect_status");
  const sessionId = searchParams.get("session_id") ?? "";

  const [status, setStatus] = useState<CheckoutSessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { refreshUser, isAuthenticated } = useUser({ autoFetch: true });
  const hasRefreshedUserRef = useRef(false);

  useEffect(() => {
    // New PaymentElement flow: redirect_status comes directly from Stripe or our router.push
    if (redirectStatus !== null) {
      setLoading(false);
      return;
    }

    // Legacy EmbeddedCheckout flow: check session via API
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    paymentService
      .getCheckoutStatus(sessionId)
      .then((data) => {
        if (!cancelled) setStatus(data);
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
  }, [sessionId, redirectStatus]);

  // Determine success: either from redirect_status param (PI flow) or API (session flow)
  const isSuccess =
    redirectStatus !== null
      ? redirectStatus === "succeeded" || redirectStatus === "processing"
      : status?.status === "complete";

  useEffect(() => {
    if (loading || !isSuccess || !isAuthenticated || hasRefreshedUserRef.current) {
      return;
    }

    hasRefreshedUserRef.current = true;
    void refreshUser();
  }, [isAuthenticated, isSuccess, loading, refreshUser]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#0c0c0c] bg-[url('/background.svg')] bg-cover bg-fixed bg-center bg-no-repeat px-4">
      {/* Logo */}
      <Image
        src={Logo}
        alt="Chariot"
        width={70}
        height={70}
        className="w-16 h-16"
        priority
      />

      {loading && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2
            className="h-10 w-10 animate-spin text-primary"
            aria-label={t("loading")}
          />
          <p className="text-sm">{t("verifying")}</p>
        </div>
      )}

      {!loading && !error && isSuccess && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2
              className="h-10 w-10 text-green-500"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("successTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("successDescription")}</p>
          <Button
            size="lg"
            className="mt-2 w-full rounded-2xl font-semibold"
            onClick={() => router.push(`/${locale}/welcome`)}>
            {t("backToApp")}
          </Button>
        </div>
      )}

      {!loading && (error || (!isSuccess && status)) && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle
              className="h-10 w-10 text-destructive"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("failureTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("failureDescription")}</p>
          <Button
            size="lg"
            className="mt-2 w-full rounded-2xl font-semibold"
            onClick={() => router.push(`/${locale}/profile`)}>
            {t("retryButton")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push(`/${locale}/welcome`)}>
            {t("backToApp")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0c0c]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
      <ReturnContent />
    </Suspense>
  );
}
