import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import sessionService, { SessionEntity } from "@/services/SessionService";
import { clearCurrentSession, selectSessionCode } from "@/store/slices/sessionSlice";
import { destroySessionSocket } from "@/lib/sessionSocketPool";
import { usePathname, useRouter } from "next/navigation";


/**
 * Hook to validate session on mount. If session is invalid/expired, clears session state.
 */
export function useSessionValidation() {
    const dispatch = useAppDispatch();
    const sessionCode = useAppSelector(selectSessionCode);
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";


    useEffect(() => {
        if (!sessionCode) return;
        let isMounted = true;
        sessionService
            .getSession(sessionCode)
            .then((response: SessionEntity) => {
                if (response.status === "closed") {
                    if (isMounted) {
                        destroySessionSocket();
                        dispatch(clearCurrentSession());
                        router.push(`/${locale}/welcome`);
                    }
                    return;
                }
                if (response.expiresAt && new Date(response.expiresAt).getTime() < Date.now()) {
                    if (isMounted) {
                        destroySessionSocket();
                        dispatch(clearCurrentSession());
                        router.push(`/${locale}/welcome`);
                    }
                }
            })
            .catch(() => {
                if (isMounted) {
                    destroySessionSocket();
                    dispatch(clearCurrentSession());
                    router.push(`/${locale}/welcome`);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [sessionCode, dispatch, router, locale]);
}
