"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import CharacterService from "@/services/CharacterService";
import { useAppDispatch } from "@/store/hooks";
import { upsertCharacterInGroups } from "@/store/slices/groupSlice";
import { upsertCharacterWithoutGroup } from "@/store/slices/characterSlice";
import type { Player } from "@/types/character";
import { buildLongRestUpdatePayload, getHitDiceRemainingForClass } from "@/utils/rest.utils";
import { BatteryMedium, BicepsFlexed, Dice5, HeartMinus, HeartPlus, Loader2, WandSparkles, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";

interface LongRestButtonProps {
    player: Player;
    isInSession: boolean;
    onApplied: (updated: Player) => void;
    showLabel?: boolean;
}

export function LongRestButton({ player, isInSession, onApplied, showLabel = false }: LongRestButtonProps) {
    const t = useTranslations("characterDetail.longRest");
    const toast = useToast();
    const dispatch = useAppDispatch();
    const sessionCode = useActiveSessionCode();
    const [pending, setPending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const hasSpellRecovery = (player.spellcasting ?? []).some((spellcasting) => {
        const hasUsedSlotsByLevel = Object.values(spellcasting.spellSlotsByLevel ?? {}).some((slot) => (slot?.used ?? 0) > 0);
        const hasUsedSpellsByDay = (spellcasting.spells ?? []).some(
            (spell) => spell.usesPerDay != null && (spell.used ?? 0) > 0,
        );
        const hasUsedSlotsByUses = Object.values(spellcasting.spellSlotsByUses ?? {}).some(
            (used) => typeof used === "number" && used > 0,
        );

        return hasUsedSlotsByLevel || hasUsedSpellsByDay || hasUsedSlotsByUses;
    });
    const hasAbilityRecovery = (player.abilities ?? []).some(
        (ability) =>
            ability.hasCounter === true &&
            ability.counterResetsOnLongRest === true &&
            (ability.counterCurrent ?? 0) > 0,
    );
    const hasSpentHitDice = (player.class ?? []).some(
        (characterClass) => getHitDiceRemainingForClass(characterClass) < Math.max(0, Math.floor(characterClass.level ?? 0)),
    );
    const hasMissingHp = player.stats.currentHitPoints < player.stats.maxHitPoints;
    const hasTempHp = player.stats.tempHitPoints > 0;
    const hasExhaustion = player.exhaustionLevel > 0;

    const restEffects = [
        hasSpellRecovery
            ? {
                  key: "spell-slots",
                  icon: (
                      <WandSparkles
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectSpellSlots"),
              }
            : null,
        hasAbilityRecovery
            ? {
                  key: "abilities",
                  icon: (
                      <BicepsFlexed
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectAbilities"),
              }
            : null,
        hasSpentHitDice
            ? {
                  key: "hit-dice",
                  icon: (
                      <Dice5
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectHitDice"),
              }
            : null,
        hasMissingHp
            ? {
                  key: "hp",
                  icon: (
                      <HeartPlus
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectHp"),
              }
            : null,
        hasTempHp
            ? {
                  key: "temp-hp",
                  icon: (
                      <HeartMinus
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectTempHp"),
              }
            : null,
        hasExhaustion
            ? {
                  key: "exhaustion",
                  icon: (
                      <BatteryMedium
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                      />
                  ),
                  label: t("effectExhaustion"),
              }
            : null,
    ].filter((effect): effect is NonNullable<typeof effect> => effect !== null);

    useEffect(() => {
        if (!isInSession) setDialogOpen(false);
    }, [isInSession]);

    const runLongRest = async () => {
        if (pending || !isInSession) return;
        setPending(true);
        try {
            const payload = buildLongRestUpdatePayload(player);
            const updated = (await CharacterService.updateCharacter("players", player._id, payload, sessionCode)) as Player;
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
        ? "h-8 shrink-0 border-border/70 bg-background/60 px-3 text-xs font-medium text-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50 disabled:text-muted-foreground"
        : "shrink-0 size-9 sm:size-10 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-50";

    const triggerButton = (
        <Button
            type="button"
            variant="outline"
            size={showLabel ? "sm" : "icon"}
            disabled={!isInSession || pending || dialogOpen}
            className={buttonClass}
            onClick={() => {
                if (isInSession && !pending && !dialogOpen) setDialogOpen(true);
            }}
            aria-label={t("ariaLabel")}
            aria-expanded={isInSession ? dialogOpen : undefined}
            aria-haspopup={isInSession ? "dialog" : undefined}>
            <Moon
                className={showLabel ? "size-4" : "size-4 sm:size-5"}
                aria-hidden="true"
            />
            {showLabel && <span>{t("ariaLabel")}</span>}
        </Button>
    );

    return (
        <>
            {!isInSession ? (
                <InfoTooltip
                    content={t("disabledTooltip")}
                    side="bottom"
                    moreInfoLabel={t("disabledTooltip")}>
                    <span className="inline-flex cursor-not-allowed">{triggerButton}</span>
                </InfoTooltip>
            ) : (
                triggerButton
            )}

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
                            variant="outline"
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
