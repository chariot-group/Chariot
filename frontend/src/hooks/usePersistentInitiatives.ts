import { useEffect, useState } from "react";

export type InitiativeMap = Record<string, string>;

export default function usePersistentInitiatives(
    key: string,
    initialValue: InitiativeMap = {}
) {
    const [initiatives, setInitiatives] = useState<InitiativeMap>(() => {
        if (typeof window === "undefined") return initialValue;

        try {
            const stored = localStorage.getItem(key);
            return stored ? (JSON.parse(stored) as InitiativeMap) : initialValue;
        } catch (err) {
            console.error("Failed to parse initiatives from localStorage", err);
            return initialValue;
        }
    });

    // Sauvegarde automatique
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(initiatives));
        }
    }, [key, initiatives]);

    return [initiatives, setInitiatives] as const;
}