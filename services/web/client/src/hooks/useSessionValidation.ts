import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useStore } from "react-redux";
import type { RootState } from "@/store";
import sessionService, { SessionEntity } from "@/services/SessionService";
import { clearCurrentSession, selectSessionCode } from "@/store/slices/sessionSlice";
import { destroySessionSocket } from "@/lib/sessionSocketPool";
import { captureSessionEndContext, navigateAfterSessionEnd } from "@/lib/sessionEndNavigation";
import { usePathname, useRouter } from "next/navigation";


/**
 * Hook to validate session on mount. If session is invalid/expired, clears session state
 * and navigates per FR-session-end-navigation (stays on a still-valid page when possible).
 */
export function useSessionValidation() {
    const dispatch = useAppDispatch();
    const store = useStore<RootState>();
    const sessionCode = useAppSelector(selectSessionCode);
    const router = useRouter();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (!sessionCode) return;
        let isMounted = true;

        const endUnavailableSession = () => {
            if (!isMounted) return;
            const context = captureSessionEndContext(store.getState(), pathnameRef.current);
            destroySessionSocket();
            dispatch(clearCurrentSession());
            void navigateAfterSessionEnd({
                sessionCode,
                context,
                router,
                dispatch,
                getState: () => store.getState(),
            });
        };

        sessionService
            .getSession(sessionCode)
            .then((response: SessionEntity) => {
                if (response.status === "closed") {
                    endUnavailableSession();
                    return;
                }
                if (response.expiresAt && new Date(response.expiresAt).getTime() < Date.now()) {
                    endUnavailableSession();
                }
            })
            .catch(() => {
                endUnavailableSession();
            });
        return () => {
            isMounted = false;
        };
    }, [sessionCode, dispatch, router, store]);
}
