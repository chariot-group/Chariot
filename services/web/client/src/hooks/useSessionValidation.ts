import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import sessionService, { SessionEntity } from "@/services/SessionService";
import { clearCurrentSession, selectSessionCode } from "@/store/slices/sessionSlice";

/**
 * Hook to validate session on mount. If session is invalid/expired, clears session state.
 */
export function useSessionValidation() {
    const dispatch = useAppDispatch();
    const sessionCode = useAppSelector(selectSessionCode);

    useEffect(() => {
        if (!sessionCode) return;
        let isMounted = true;
        sessionService
            .getSession(sessionCode)
            .then((response: SessionEntity) => {
                if (response.expiresAt && new Date(response.expiresAt).getTime() < Date.now()) {
                    if (isMounted) {
                        dispatch(clearCurrentSession());
                    }
                }
            })
            .catch(() => {
                if (isMounted) {
                    dispatch(clearCurrentSession());
                }
            });
        return () => {
            isMounted = false;
        };
    }, [sessionCode, dispatch]);
}
