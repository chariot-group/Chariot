"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { getAccountGateSteps } from "@/lib/accountGate";
import { LazyAccountGateModal } from "@/components/lazy/lazyDialogs";

/**
 * Loads the current user and opens the blocking account gate while a condition is unmet.
 * The modal code is fetched only for blocked accounts (FR-web-first-load-performance). It fails
 * open: no user, a failed fetch or a failed modal load never locks the application.
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
export default function AccountGateProvider() {
  const { user } = useUser({ autoFetch: true });
  const [loadFailed, setLoadFailed] = useState(false);

  const open = getAccountGateSteps(user).length > 0 && !loadFailed;
  if (!open) return null;

  return (
    <LazyAccountGateModal
      open={open}
      onOpenChange={(nextOpen) => {
        // Only fired when the modal code fails to load: stop retrying in a loop.
        if (!nextOpen) setLoadFailed(true);
      }}
    />
  );
}
