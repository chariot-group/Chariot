"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import CharacterService from "@/services/CharacterService";
import { useAppDispatch } from "@/store/hooks";
import { upsertCharacterInGroups } from "@/store/slices/groupSlice";
import { upsertCharacterWithoutGroup } from "@/store/slices/characterSlice";
import type { Class, Player } from "@/types/character";
import {
    buildShortRestUpdatePayload,
    getHitDiceRemainingForClass,
    hitDieSide,
    type ShortRestHitDiceRoll,
} from "@/utils/rest.utils";
import { Clock, Loader2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";

interface ShortRestButtonProps {
    player: Player;
    isInSession: boolean;
    onApplied: (updated: Player) => void;
}

type RollRow = { id: string; classIndex: number; value: string };

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseShortRestHitDiceRolls(rollRows: RollRow[], classesList: Class[]): ShortRestHitDiceRoll[] | null {
    const out: ShortRestHitDiceRoll[] = [];
    for (const row of rollRows) {
        const v = Number.parseInt(row.value.trim(), 10);
        const side = hitDieSide(classesList[row.classIndex]);
        if (!Number.isInteger(v) || v < 1 || v > side) return null;
        out.push({ classIndex: row.classIndex, value: v });
    }
    return out;
}

/** Garde uniquement des valeurs entières dans [1, side] ou chaîne vide. */
function sanitizeHitDieRaw(raw: string, side: number): string {
    if (raw.trim() === "") return "";
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return "";
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n < 1) return "";
    return String(Math.min(side, n));
}

const hitDiceScrollAreaClass =
    "max-h-[min(42dvh,18.5rem)] sm:max-h-[min(44dvh,22rem)] overflow-y-auto overflow-x-hidden pr-2 -mr-1 scroll-smooth " +
    "[scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/50 " +
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/35";

export function ShortRestButton({ player, isInSession, onApplied }: ShortRestButtonProps) {
    const t = useTranslations("characterDetail.shortRest");
    const tClass = useTranslations("classes");
    const toast = useToast();
    const dispatch = useAppDispatch();
    const baseId = useId();
    const [pending, setPending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [rollRows, setRollRows] = useState<RollRow[]>([]);

    const classes = useMemo(() => player.class ?? [], [player.class]);

    useEffect(() => {
        if (!isInSession) setDialogOpen(false);
    }, [isInSession]);

    useEffect(() => {
        if (!dialogOpen) setRollRows([]);
    }, [dialogOpen]);

    const spentPerClass = useMemo(() => {
        const counts = classes.map(() => 0);
        for (const row of rollRows) {
            if (row.classIndex >= 0 && row.classIndex < counts.length) {
                counts[row.classIndex] += 1;
            }
        }
        return counts;
    }, [rollRows, classes]);

    const remainingAfterPending = useMemo(
        () => classes.map((c, i) => Math.max(0, getHitDiceRemainingForClass(c) - spentPerClass[i])),
        [classes, spentPerClass],
    );

    const canAddForClass = (classIndex: number) => remainingAfterPending[classIndex] > 0;

    const addDie = (classIndex: number) => {
        if (!canAddForClass(classIndex)) return;
        setRollRows((prev) => [...prev, { id: makeId(), classIndex, value: "" }]);
    };

    const removeLastForClass = (classIndex: number) => {
        setRollRows((prev) => {
            for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].classIndex === classIndex) {
                    return prev.filter((_, j) => j !== i);
                }
            }
            return prev;
        });
    };

    const handleDieValueChange = (id: string, raw: string, side: number) => {
        const next = sanitizeHitDieRaw(raw, side);
        setRollRows((prev) => prev.map((r) => (r.id === id ? { ...r, value: next } : r)));
    };

    const parsedRolls = useMemo(
        () => parseShortRestHitDiceRolls(rollRows, classes),
        [rollRows, classes],
    );

    const healingPreview = useMemo(() => {
        if (!parsedRolls) return null;
        return parsedRolls.reduce((s, r) => s + r.value, 0);
    }, [parsedRolls]);

    const runShortRest = async () => {
        if (pending || !isInSession) return;
        const rolls = parseShortRestHitDiceRolls(rollRows, classes);
        if (rollRows.length > 0 && rolls === null) {
            toast.error(t("invalidRoll"));
            return;
        }
        setPending(true);
        try {
            const payload = buildShortRestUpdatePayload(player, rolls ?? []);
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
            <Clock
                className="size-4 sm:size-5"
                aria-hidden="true"
            />
        </Button>
    );

    const rowsByClass = classes.map((_, ci) => rollRows.filter((r) => r.classIndex === ci));

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
                <Tooltip>
                    <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
                    <TooltipContent
                        side="bottom"
                        className="max-w-xs text-left">
                        {t("ariaLabel")}
                    </TooltipContent>
                </Tooltip>
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => !pending && setDialogOpen(open)}>
                <DialogContent
                    showCloseButton={!pending}
                    className="max-w-lg max-h-[92vh] sm:max-h-[min(92vh,44rem)] overflow-hidden grid grid-rows-[auto_1fr_auto]"
                    onPointerDownOutside={(e) => pending && e.preventDefault()}
                    onEscapeKeyDown={(e) => pending && e.preventDefault()}>
                    <DialogHeader className="shrink-0">
                        <DialogTitle>{t("confirmTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-foreground min-h-0 overflow-y-auto pr-1 -mr-1 flex flex-col gap-3">
                        <p>{t("confirmIntro")}</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground shrink-0">
                            <li>{t("effectAbilitiesShort")}</li>
                            <li>{t("effectWarlockSlots")}</li>
                        </ul>

                        <div
                            className={cn(
                                "rounded-[15px] border border-border bg-card text-card-foreground p-4 shadow-sm space-y-3 shrink-0",
                            )}>
                            <div className="min-w-0 space-y-1">
                                <p className="font-semibold text-foreground leading-tight">{t("hitDiceSectionTitle")}</p>
                                <p className="text-xs text-muted-foreground leading-snug">{t("hitDiceSectionHint")}</p>
                            </div>

                            <div className={hitDiceScrollAreaClass}>
                                <div className="space-y-4 pr-0.5">
                                    {classes.map((c, classIndex) => {
                                        if ((c.level ?? 0) <= 0) return null;
                                        const side = hitDieSide(c);
                                        const maxPool = getHitDiceRemainingForClass(c);
                                        const rows = rowsByClass[classIndex];
                                        const canRemove = rows.length > 0;
                                        return (
                                            <div
                                                key={`${c.name}-${classIndex}`}
                                                className="rounded-[15px] border border-border bg-background p-3 space-y-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-xs sm:text-sm font-medium leading-snug min-w-0">
                                                        {t("hitDicePool", {
                                                            name: tClass(c.name),
                                                            remaining: maxPool - spentPerClass[classIndex],
                                                            max: maxPool,
                                                            side,
                                                        })}
                                                    </span>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="inline-flex">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="size-8 border-border bg-background/90 shadow-xs"
                                                                        disabled={pending || !canAddForClass(classIndex)}
                                                                        onClick={() => addDie(classIndex)}
                                                                        aria-label={t("addDie")}>
                                                                        <Plus
                                                                            className="size-3.5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="bottom"
                                                                className="max-w-xs text-left text-xs leading-snug rounded-[15px]">
                                                                {t("addDieTooltip")}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="inline-flex">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="size-8 border-border bg-background/90 shadow-xs"
                                                                        disabled={pending || !canRemove}
                                                                        onClick={() => removeLastForClass(classIndex)}
                                                                        aria-label={t("removeLastDie")}>
                                                                        <Minus
                                                                            className="size-3.5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="bottom"
                                                                className="max-w-xs text-left text-xs leading-snug rounded-[15px]">
                                                                {t("removeLastDieTooltip")}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                {rows.length > 0 ? (
                                                    <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 gap-2">
                                                        {rows.map((row, ri) => (
                                                            <div
                                                                key={row.id}
                                                                className="rounded-[15px] border border-border bg-background px-2 py-1.5 shadow-xs">
                                                                <label
                                                                    className="sr-only"
                                                                    htmlFor={`${baseId}-r-${row.id}`}>
                                                                    {`${t("rollLabel")} ${ri + 1} (d${side})`}
                                                                </label>
                                                                <Input
                                                                    id={`${baseId}-r-${row.id}`}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    autoComplete="off"
                                                                    disabled={pending}
                                                                    placeholder={`1–${side}`}
                                                                    value={row.value}
                                                                    onChange={(e) =>
                                                                        handleDieValueChange(
                                                                            row.id,
                                                                            e.target.value,
                                                                            side,
                                                                        )
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (
                                                                            e.key === "-" ||
                                                                            e.key === "e" ||
                                                                            e.key === "E" ||
                                                                            e.key === "+" ||
                                                                            e.key === "."
                                                                        ) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className="h-8 px-2 text-center text-sm tabular-nums bg-background border-border/80"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {t("hitDiceEmptyHint")}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {healingPreview != null && rollRows.length > 0 && (
                            <p className="text-sm font-medium shrink-0">{t("totalHealing", { n: healingPreview })}</p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2 shrink-0 border-t border-border/60 pt-2">
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
                            onClick={() => void runShortRest()}>
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
