"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { computeWheelProgressPercent } from "@/lib/sessionWheelDeposit";
import { Loader2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

interface SessionWheelDepositBarProps {
    totalDeposited: number;
    maxSlots: number;
    myDeposited: number;
    balance: number;
    maxAddable: number;
    isMJ: boolean;
    isLaunching: boolean;
    isLeaving: boolean;
    quotaFull: boolean;
    leaveLabel: string;
    onAddOne: () => void;
    onRemoveOne: () => void;
    onRemoveAll: () => void;
    onDepositRemaining: () => void;
    onLaunch: () => void;
    onLeave: () => void;
    extraActions?: ReactNode;
}

export function SessionWheelDepositBar({
    totalDeposited,
    maxSlots,
    myDeposited,
    balance,
    maxAddable,
    isMJ,
    isLaunching,
    isLeaving,
    quotaFull,
    leaveLabel,
    onAddOne,
    onRemoveOne,
    onRemoveAll,
    onDepositRemaining,
    onLaunch,
    onLeave,
    extraActions,
}: SessionWheelDepositBarProps) {
    const t = useTranslations("sessionPage.players.wheels");
    const tCommon = useTranslations("common");
    const progressId = useId();
    const progressPercent = computeWheelProgressPercent(totalDeposited, maxSlots);
    const remainingBalance = Math.max(0, balance - myDeposited);

    return (
        <section
            aria-labelledby={progressId}
            className="w-full shrink-0 rounded-[15px] bg-gray-middle-light px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p
                        id={progressId}
                        className="text-xs font-medium sm:text-sm">
                        {t("sessionProgress", { total: totalDeposited, max: maxSlots })}
                    </p>
                    <p
                        className="text-xs tabular-nums text-muted-foreground"
                        aria-label={t("depositBalanceAria", {
                            deposited: myDeposited,
                            remaining: remainingBalance,
                        })}>
                        {t("depositBalanceShort", {
                            deposited: myDeposited,
                            remaining: remainingBalance,
                        })}
                    </p>
                </div>

                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={maxSlots}
                    aria-valuenow={totalDeposited}
                    aria-label={t("progressAria", { total: totalDeposited, max: maxSlots })}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-gray">
                    <div
                        className="h-full rounded-full bg-green transition-[width] duration-200 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {quotaFull && !isMJ ? (
                    <p
                        className="text-xs text-muted-foreground"
                        role="status">
                        {t("waitingForGm")}
                    </p>
                ) : null}

                <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                        <div
                            className="flex shrink-0 items-center gap-1"
                            role="group"
                            aria-label={t("adjustMineAria", { count: myDeposited })}>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                disabled={myDeposited <= 0}
                                aria-label={t("removeOneAria")}
                                onClick={onRemoveOne}>
                                <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span
                                className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums"
                                aria-live="polite">
                                {myDeposited}
                            </span>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                disabled={maxAddable <= 0}
                                aria-label={t("addOneAria")}
                                onClick={onAddOne}>
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {maxAddable > 1 ? (
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="h-8 shrink-0 px-2.5 text-xs sm:px-3"
                                onClick={onDepositRemaining}>
                                {t("depositRemaining", { count: maxAddable })}
                            </Button>
                        ) : null}

                        {myDeposited > 1 ? (
                            <ConfirmDialog
                                title={t("removeAllConfirmTitle")}
                                description={t("removeAllConfirmDescription", { count: myDeposited })}
                                confirmLabel={t("removeAllConfirmButton")}
                                cancelLabel={tCommon("cancel")}
                                onConfirm={onRemoveAll}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 shrink-0 px-2 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive">
                                    {t("removeAllButton", { count: myDeposited })}
                                </Button>
                            </ConfirmDialog>
                        ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        {extraActions}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 px-2.5 text-xs sm:px-3"
                            disabled={isLeaving}
                            onClick={onLeave}>
                            {leaveLabel}
                        </Button>
                        {quotaFull && isMJ ? (
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 shrink-0 px-2.5 text-xs sm:px-3"
                                disabled={isLaunching}
                                aria-label={t("launchAria")}
                                onClick={onLaunch}>
                                {isLaunching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {t("launchButton")}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
