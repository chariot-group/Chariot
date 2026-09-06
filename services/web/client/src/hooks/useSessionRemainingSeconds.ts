import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectSessionExpiresAt, selectSessionStatus } from "@/store/slices/sessionSlice";
import {
  computeSessionRemainingSeconds,
  shouldShowSessionTimer,
} from "@/lib/sessionPresenceUi";

/** @see FR-session-lobby-navigation */
export function useSessionRemainingSeconds(): number | null {
  const status = useAppSelector(selectSessionStatus);
  const expiresAt = useAppSelector(selectSessionExpiresAt);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldShowSessionTimer(status, expiresAt) || !expiresAt) {
      setRemaining(null);
      return;
    }

    const compute = () => {
      setRemaining(computeSessionRemainingSeconds(expiresAt, Date.now()));
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [status, expiresAt]);

  return remaining;
}
