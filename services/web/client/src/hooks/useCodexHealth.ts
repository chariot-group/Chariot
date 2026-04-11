import { useState, useEffect } from 'react';
import CodexService from '@/services/CodexService';

const HEALTH_CHECK_INTERVAL = 30000; // 30 secondes

/**
 * Hook pour vérifier la disponibilité du service Codex
 * @returns Un objet contenant l'état de disponibilité et le statut de chargement
 */
export function useCodexHealth() {
    const [isAvailable, setIsAvailable] = useState(true);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const checkHealth = async () => {
            setIsChecking(true);
            try {
                const available = await CodexService.checkHealth();
                if (isMounted) {
                    setIsAvailable(available);
                }
            } catch {
                if (isMounted) {
                    setIsAvailable(false);
                }
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                    // Planifier le prochain check
                    timeoutId = setTimeout(checkHealth, HEALTH_CHECK_INTERVAL);
                }
            }
        };

        // Premier check immédiat
        checkHealth();

        return () => {
            isMounted = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    return { isAvailable, isChecking };
}
