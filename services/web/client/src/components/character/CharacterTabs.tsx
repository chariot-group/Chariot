"use client";

import { useTranslations } from "next-intl";
import { BookOpen, Swords, Sparkles, Package, ScrollText } from "lucide-react";

export type CharacterTab =
    | "general"
    | "combat"
    | "magic"
    | "inventory"
    | "history";

interface CharacterTabsProps {
    activeTab: CharacterTab;
    onTabChange: (tab: CharacterTab) => void;
}

export const TAB_COLORS: Record<CharacterTab, string> = {
    general: "var(--blue)",
    combat: "var(--red)",
    magic: "var(--pink)",
    inventory: "var(--yellow)",
    history: "var(--green)",
};

const TAB_ICONS = {
    general: BookOpen,
    combat: Swords,
    magic: Sparkles,
    inventory: Package,
    history: ScrollText,
};

export default function CharacterTabs({
    activeTab,
    onTabChange,
}: CharacterTabsProps) {
    const t = useTranslations("characterDetail.tabs");

    const tabs: CharacterTab[] = [
        "general",
        "combat",
        "magic",
        "inventory",
        "history",
    ];

    return (
        <div className="flex flex-col gap-2">
            {tabs.map((tab) => {
                const Icon = TAB_ICONS[tab];
                const isActive = activeTab === tab;
                const color = TAB_COLORS[tab];

                return (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`
                            flex items-center gap-3 px-6 py-4 rounded-lg
                            transition-all duration-200
                            text-left
                            ${
                                isActive
                                    ? "bg-gray shadow-lg scale-105"
                                    : "bg-gray/50 hover:bg-gray/70 hover:scale-102"
                            }
                        `}
                        style={{
                            borderLeft: isActive
                                ? `4px solid ${color}`
                                : "4px solid transparent",
                        }}
                    >
                        <Icon
                            className="w-5 h-5 shrink-0"
                            style={{ color: isActive ? color : "#b2b2b2" }}
                        />
                        <span
                            className={`font-semibold ${
                                isActive ? "text-white" : "text-gray-light"
                            }`}
                            style={{ color: isActive ? color : undefined }}
                        >
                            {t(tab)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
