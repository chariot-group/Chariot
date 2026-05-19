"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Player } from "@/types/character";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
  sessionCode: string | null;
  onCharacterUpdate?: (updated: Player) => void;
}

type HealthAction = "add" | "subtract" | "set";

function clampToNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function applyCurrentHpAction(player: Player, amount: number, action: HealthAction) {
  const maxHp = Math.max(0, player.stats.maxHitPoints ?? 0);
  const currentHp = Math.max(0, player.stats.currentHitPoints ?? 0);
  const tempHp = Math.max(0, player.stats.tempHitPoints ?? 0);

  if (action === "add") {
    return {
      currentHitPoints: Math.min(maxHp, currentHp + amount),
      tempHitPoints: tempHp,
    };
  }

  if (action === "subtract") {
    const tempDamage = Math.min(tempHp, amount);
    const damageLeft = amount - tempDamage;

    return {
      currentHitPoints: Math.max(0, currentHp - damageLeft),
      tempHitPoints: tempHp - tempDamage,
    };
  }

  return {
    currentHitPoints: Math.min(maxHp, amount),
    tempHitPoints: tempHp,
  };
}

export function SessionHealthDialog({
  open,
  onOpenChange,
  player,
  sessionCode,
  onCharacterUpdate,
}: SessionHealthDialogProps) {
  const t = useTranslations("characterDetail.battle");
  const toast = useToast();
  const [busyAction, setBusyAction] = useState<"current" | "temp" | null>(null);
  const [currentHpValue, setCurrentHpValue] = useState("");
  const [tempHpValue, setTempHpValue] = useState("");
  const [showTempControls, setShowTempControls] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentHpValue("");
      setTempHpValue("");
      setShowTempControls(false);
    }
  }, [open]);

  const currentAmount = useMemo(() => clampToNonNegative(Number(currentHpValue)), [currentHpValue]);
  const tempAmount = useMemo(() => clampToNonNegative(Number(tempHpValue)), [tempHpValue]);
  const canApplyCurrent = currentHpValue.trim() !== "";
  const canApplyTemp = tempHpValue.trim() !== "";

  async function persistStats(nextCurrentHitPoints: number, nextTempHitPoints: number) {
    if (!onCharacterUpdate) {
      return;
    }

    const updated = (await CharacterService.updateCharacter(
      "players",
      player._id,
      {
        stats: {
          ...player.stats,
          currentHitPoints: nextCurrentHitPoints,
          tempHitPoints: nextTempHitPoints,
        },
      },
      sessionCode,
    )) as Player;

    onCharacterUpdate(updated);
  }

  async function handleCurrentHpAction(action: HealthAction) {
    if (!canApplyCurrent || busyAction || !onCharacterUpdate) {
      return;
    }

    setBusyAction("current");

    try {
      const next = applyCurrentHpAction(player, currentAmount, action);
      await persistStats(next.currentHitPoints, next.tempHitPoints);
      setCurrentHpValue("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(t("sessionHpUpdateError"));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddTempHp() {
    if (!canApplyTemp || busyAction || !onCharacterUpdate) {
      return;
    }

    setBusyAction("temp");

    try {
      await persistStats(player.stats.currentHitPoints, Math.max(0, player.stats.tempHitPoints) + tempAmount);
      setTempHpValue("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(t("sessionHpUpdateError"));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busyAction) {
          onOpenChange(nextOpen);
        }
      }}>
      <DialogContent
        showCloseButton={!busyAction}
        className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("sessionHpDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 rounded-[15px] border border-border/60 bg-card/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">{t("sessionCurrentHpSection")}</h3>
            <p className="text-sm text-muted-foreground">
              {player.stats.currentHitPoints}/{player.stats.maxHitPoints}
              {player.stats.tempHitPoints > 0 ? ` (+${player.stats.tempHitPoints} ${t("hpAbbr")})` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={currentHpValue}
              onChange={(event) => setCurrentHpValue(event.target.value)}
              placeholder={t("sessionHpAmountPlaceholder")}
              aria-label={t("sessionHpAmountPlaceholder")}
              disabled={busyAction !== null}
              className="h-9 min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={!canApplyCurrent || busyAction !== null}
              aria-label={t("sessionSubtractCurrentHp")}
              onClick={() => void handleCurrentHpAction("subtract")}>
              {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              -
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={!canApplyCurrent || busyAction !== null}
              aria-label={t("sessionAddCurrentHp")}
              onClick={() => void handleCurrentHpAction("add")}>
              {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              +
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={!canApplyCurrent || busyAction !== null}
              aria-label={t("sessionSetCurrentHp")}
              onClick={() => void handleCurrentHpAction("set")}>
              {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              =
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-[15px] border border-border/60 bg-card/60 p-3 sm:p-4">
          <button
            type="button"
            className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md text-left focus:outline-none"
            onClick={() => setShowTempControls((current) => !current)}
            aria-expanded={showTempControls}>
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="text-base font-semibold">{t("sessionTempHpSection")}</h3>
              <ChevronDown
                className={`size-4 shrink-0 transition-transform ${showTempControls ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground">+{player.stats.tempHitPoints} {t("hpAbbr")}</p>
          </button>

          {showTempControls ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={tempHpValue}
                onChange={(event) => setTempHpValue(event.target.value)}
                placeholder={t("sessionTempHpAmountPlaceholder")}
                aria-label={t("sessionTempHpAmountPlaceholder")}
                disabled={busyAction !== null}
                className="h-9 min-w-0 flex-1"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-9 px-2 text-lg font-semibold"
                disabled={!canApplyTemp || busyAction !== null}
                aria-label={t("sessionAddTempHp")}
                onClick={() => void handleAddTempHp()}>
                {busyAction === "temp" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                +
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
