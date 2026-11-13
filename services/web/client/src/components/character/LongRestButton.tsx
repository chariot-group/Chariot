"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import CharacterService from "@/services/CharacterService";
import { useAppDispatch } from "@/store/hooks";
import { upsertCharacterInGroups } from "@/store/slices/groupSlice";
import { upsertCharacterWithoutGroup } from "@/store/slices/characterSlice";
import type { NPC, Player } from "@/types/character";
import {
    buildCharacterLongRestUpdatePayload,
    getLongRestEffects,
    type LongRestEffect,
} from "@/utils/rest.utils";
import { isPlayer } from "@/utils/global.utils";
import {
    BatteryMedium,
    BicepsFlexed,
    Dice5,
    HeartMinus,
    HeartPlus,
    Loader2,
    WandSparkles,
    Moon,
    type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";

interface LongRestButtonProps {
    character: Player | NPC;
    onApplied: (updated: Player | NPC) => void;
    showLabel?: boolean;
}

const EFFECT_ICONS: Record<LongRestEffect, LucideIcon> = {
    "spell-slots": WandSparkles,
    abilities: BicepsFlexed,
    "hit-dice": Dice5,
    hp: HeartPlus,
    "temp-hp": HeartMinus,
    exhaustion: BatteryMedium,
};

const EFFECT_LABEL_KEYS = {
    "spell-slots": "effectSpellSlots",
    abilities: "effectAbilities",
    "hit-dice": "effectHitDice",
    hp: "effectHp",
    "temp-hp": "effectTempHp",
    exhaustion: "effectExhaustion",
} as const satisfies Record<LongRestEffect, string>;

/**
 * Rendu uniquement quand le repos long est permis (`canUseLongRest`).
 * @see FR-character-long-rest
 */
export function LongRestButton({ character, onApplied, showLabel = false }: LongRestButtonProps) {
    const t = useTranslations("characterDetail.longRest");
    const toast = useToast();
    const dispatch = useAppDispatch();
    const sessionCode = useActiveSessionCode();
    const [pending, setPending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const restEffects = getLongRestEffects(character).map((key) => {
        const Icon = EFFECT_ICONS[key];
        return {
            key,
            icon: (
                <Icon
                    className="size-7 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                />
            ),
            label: t(EFFECT_LABEL_KEYS[key]),
        };
    });

    const runLongRest = async () => {
        if (pending) return;
        setPending(true);
        try {
            const payload = buildCharacterLongRestUpdatePayload(character);
            const type = isPlayer(character) ? "players" : "npcs";
            const updated = await CharacterService.updateCharacter(type, character._id, payload, sessionCode);
            if (isPlayer(updated)) {
                dispatch(upsertCharacterWithoutGroup(updated));
                const withUser = updated as Player & { userId?: string };
                dispatch(
                    upsertCharacterInGroups({
                        _id: updated._id,
                        firstname: updated.firstname,
                        lastname: updated.lastname,
                        surname: updated.surname,
                        userId: withUser.userId,
                    }),
                );
            }
            onApplied(updated);
            toast.success(t("success"));
            setDialogOpen(false);
        } catch {
            toast.error(t("error"));
        } finally {
            setPending(false);
        }
    };

    const buttonClass = showLabel
        ? "h-8 shrink-0 border-border/70 bg-background/60 px-3 text-xs font-medium text-foreground hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50 disabled:text-muted-foreground"
        : "shrink-0 size-9 sm:size-10 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-50";

    const triggerButton = (
        <Button
            type="button"
            variant="secondary"
            size={showLabel ? "sm" : "icon"}
            disabled={pending || dialogOpen}
            className={buttonClass}
            onClick={() => {
                if (!pending && !dialogOpen) setDialogOpen(true);
            }}
            aria-label={t("ariaLabel")}
            aria-expanded={dialogOpen}
            aria-haspopup="dialog">
            <Moon
                className={showLabel ? "size-4" : "size-4 sm:size-5"}
                aria-hidden="true"
            />
            {showLabel && <span>{t("ariaLabel")}</span>}
        </Button>
    );

    return (
        <>
            {triggerButton}

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => !pending && setDialogOpen(open)}>
                <DialogContent
                    showCloseButton={!pending}
                    className="max-w-lg"
                    onPointerDownOutside={(e) => pending && e.preventDefault()}
                    onEscapeKeyDown={(e) => pending && e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl">{t("confirmTitle")}</DialogTitle>
                    </DialogHeader>
                    <div>
                        {restEffects.length > 0 ? (
                            <ul className="space-y-2 text-sm text-foreground sm:text-base">
                                {restEffects.map((effect) => (
                                    <li
                                        key={effect.key}
                                        className="flex items-start gap-2.5 leading-6">
                                        <span className="mt-1">{effect.icon}</span>
                                        <span>{effect.label}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground sm:text-base">{t("noMechanicalEffect")}</p>
                        )}
                    </div>
                    <DialogFooter className="flex-row justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => setDialogOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button
                            type="button"
                            disabled={pending}
                            className="gap-2 inline-flex items-center"
                            onClick={() => void runLongRest()}>
                            {pending ? (
                                <>
                                    <Loader2
                                        className="size-4 animate-spin shrink-0"
                                        aria-hidden="true"
                                    />
                                    {t("confirming")}
                                </>
                            ) : (
                                t("confirm")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
