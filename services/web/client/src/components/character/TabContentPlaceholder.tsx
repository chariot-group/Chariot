"use client";

import { CharacterTab } from "./CharacterDetailView";

interface TabContentPlaceholderProps {
    tab: CharacterTab;
    accentColor: string;
}

export default function TabContentPlaceholder({
    tab,
    accentColor,
}: TabContentPlaceholderProps) {
    return (
        <div
            className="p-12 rounded-xl bg-card/50 min-h-125 flex items-center justify-center border border-gray"
        >
            <div className="text-center space-y-4">
                <div
                    className={`text-8xl font-bold opacity-10 ${accentColor}`}
                >
                    {tab.toUpperCase()}
                </div>
                <p className="text-gray-middle-light text-xl">
                    Contenu de l&apos;onglet à implémenter
                </p>
            </div>
        </div>
    );
}

export type { CharacterTab };
