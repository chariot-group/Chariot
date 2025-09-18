import { useEffect, useState } from "react";

export type InitiativeMap = Record<string, string>;

export default function usePersistentInitiatives<T>(
    key: string,
    initialValue: T
) {
    const [initiatives, setInitiatives] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;

        try {
            const stored = localStorage.getItem(key);
            if (stored == "undefined") return undefined as T;
            return stored ? (JSON.parse(stored) as T) : initialValue;
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