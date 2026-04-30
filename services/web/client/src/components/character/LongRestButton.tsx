"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CharacterService from "@/services/CharacterService";
import { useAppDispatch } from "@/store/hooks";
import { upsertCharacterInGroups } from "@/store/slices/groupSlice";
import { upsertCharacterWithoutGroup } from "@/store/slices/characterSlice";
import type { Player } from "@/types/character";
import { buildLongRestUpdatePayload } from "@/utils/rest.utils";
import { Moon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";

interface LongRestButtonProps {
    player: Player;
    isInSession: boolean;
    onApplied: (updated: Player) => void;
}

export function LongRestButton({ player, isInSession, onApplied }: LongRestButtonProps) {
    const t = useTranslations("characterDetail.longRest");
    const toast = useToast();
    const dispatch = useAppDispatch();
    const [pending, setPending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (!isInSession) setDialogOpen(false);
    }, [isInSession]);

    const runLongRest = async () => {
        if (pending || !isInSession) return;
        setPending(true);
        try {
            const payload = buildLongRestUpdatePayload(player);
            const updated = (await CharacterService.updateCharacter("players", player._id, payload)) as Player;
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

    const buttonClass =
        "shrink-0 size-9 sm:size-10 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-50 disabled:pointer-events-none";

    const triggerButton = (
        <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!isInSession || pending || dialogOpen}
            className={buttonClass}
            onClick={() => {
                if (isInSession && !pending && !dialogOpen) setDialogOpen(true);
            }}
            aria-label={t("ariaLabel")}
            aria-expanded={isInSession ? dialogOpen : undefined}
            aria-haspopup={isInSession ? "dialog" : undefined}>
            <Moon
                className="size-4 sm:size-5"
                aria-hidden="true"
            />
        </Button>
    );

    return (
        <>
            {!isInSession ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex cursor-not-allowed">{triggerButton}</span>
                    </TooltipTrigger>
                    <TooltipContent
                        side="bottom"
                        className="max-w-xs text-left">
                        {t("disabledTooltip")}
                    </TooltipContent>
                </Tooltip>
            ) : (
                triggerButton
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => !pending && setDialogOpen(open)}>
                <DialogContent
                    showCloseButton={!pending}
                    className="max-w-md"
                    onPointerDownOutside={(e) => pending && e.preventDefault()}
                    onEscapeKeyDown={(e) => pending && e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{t("confirmTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-foreground space-y-3">
                        <p>{t("confirmIntro")}</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                            <li>{t("effectSpellSlots")}</li>
                            <li>{t("effectAbilities")}</li>
                            <li>{t("effectHitDice")}</li>
                            <li>{t("effectHp")}</li>
                            <li>{t("effectTempHp")}</li>
                            <li>{t("effectExhaustion")}</li>
                        </ul>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
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
