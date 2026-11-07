"use client";

import { useToast } from "@/hooks/useToast";
import { useUser } from "@/hooks/useUser";
import { refreshUserAfterPaymentSuccess } from "@/lib/paymentSuccessRefresh";
import NavigationService from "@/services/NavigationService";
import { useAppDispatch } from "@/store/hooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "react-redux";
import { RootState } from "@/store";

export default function Home() {
  const t = useTranslations("payment");
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const searchParams = useSearchParams();
  const { user, refreshUser, isAuthenticated } = useUser({ autoFetch: true });
  const dispatch = useAppDispatch();
  const handledPaymentRef = useRef<string | null>(null);

  const store = useStore<RootState>();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus !== "success" || !isAuthenticated) {
      return;
    }

    const paymentKey = searchParams.toString();
    if (handledPaymentRef.current === paymentKey) {
      return;
    }
    handledPaymentRef.current = paymentKey;

    const previousBalance = user?.balance ?? 0;

    const handlePaymentSuccess = async () => {
      try {
        await refreshUserAfterPaymentSuccess({
          refreshUser,
          previousBalance,
          toast,
          messages: {
            reloadSuccess: (values) => t("reloadSuccess", values),
            reloadSuccessUnknown: () => t("reloadSuccessUnknown"),
            reloadPending: () => t("reloadPending"),
          },
        });
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const destination = await NavigationService.determinePostLoginDestination(
            locale,
            dispatch,
            store.getState.bind(store),
          );
          router.push(destination.path);
        } catch {
          router.push(`/${locale}/welcome`);
        }
      }
    };

    handlePaymentSuccess();
  }, [dispatch, isAuthenticated, locale, refreshUser, router, searchParams, t, toast, user?.balance, store]);

  return <div></div>;
}
