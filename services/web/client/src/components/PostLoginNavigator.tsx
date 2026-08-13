"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKeycloak } from "@/providers/KeycloakProvider";
import NavigationService from "@/services/NavigationService";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store";
import { useStore } from "react-redux";
import referralService from "@/services/ReferralService";
import {
  getPostLoginUserId,
  markPostLoginCompleted,
  shouldAttemptPostLoginRedirect,
} from "@/lib/postLoginNavigation";

const REFERRAL_CODE_STORAGE_KEY = "chariot_referral_code";
const REFERRAL_INIT_STORAGE_KEY = "chariot_referral_initialized";

/**
 * Component responsible for handling post-login navigation (FR-post-auth-navigation)
 * Also handles referral code initialization on first login.
 * Must be rendered INSIDE ReduxProvider to access Redux store
 */
export default function PostLoginNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const { authenticated, loading, userTransitioning } = useKeycloak();
  const dispatch = useAppDispatch();

  const store = useStore<RootState>();

  const hasHandledAuthRef = useRef(false);
  const hasInitReferralRef = useRef(false);

  // Capture ?ref=CODE from URL into localStorage (runs once on mount, client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, refCode.toUpperCase().trim());
    }
  }, []);

  // Initialize referral on first login (once per device)
  useEffect(() => {
    if (!authenticated || loading || hasInitReferralRef.current) return;

    const alreadyInitialized = localStorage.getItem(REFERRAL_INIT_STORAGE_KEY);
    if (alreadyInitialized) return;

    hasInitReferralRef.current = true;

    const storedCode = localStorage.getItem(REFERRAL_CODE_STORAGE_KEY) ?? undefined;

    referralService
      .init(storedCode)
      .then(() => {
        localStorage.setItem(REFERRAL_INIT_STORAGE_KEY, "1");
        if (storedCode) localStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
      })
      .catch((err) => {
        console.warn("Referral init failed:", err?.response?.data?.message ?? err.message);
        hasInitReferralRef.current = false;
      });
  }, [authenticated, loading]);

  useEffect(() => {
    const handlePostLoginNavigation = async () => {
      if (!authenticated || loading || userTransitioning) return;

      const userId = getPostLoginUserId();
      if (hasHandledAuthRef.current || !shouldAttemptPostLoginRedirect(pathname, userId)) {
        return;
      }

      // Mark before await so remounts / /locale bounces cannot re-enter (FR-user-cache-isolation).
      hasHandledAuthRef.current = true;
      markPostLoginCompleted(userId);

      try {
        const destination = await NavigationService.determinePostLoginDestination(
          locale,
          dispatch,
          store.getState.bind(store),
        );
        router.replace(destination.path);
      } catch (error) {
        console.error("Failed to determine post-login destination:", error);
        router.replace(`/${locale}/welcome`);
      }
    };

    void handlePostLoginNavigation();
  }, [authenticated, loading, userTransitioning, pathname, locale, router, dispatch, store]);

  return null;
}
