"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Loader2, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CharacterType } from "@/hooks/useCharacterForm";
import type { DeathSaves, NPC, Player } from "@/types/character";
import { isPlayer } from "@/utils/global.utils";
import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
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
import {
  DIALOG_SECTIONED_CONTENT_CLASS,
  DIALOG_SECTION_BODY_CLASS,
  DIALOG_SECTION_HEADER_CLASS,
  DIALOG_SECTION_TITLE_CLASS,
} from "@/components/ui/dialog-sections";

interface SessionHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Player | NPC;
  characterType: CharacterType;
  sessionCode: string | null;
  onCharacterUpdate?: (updated: Player | NPC) => void;
  /** FR-combat-initiative-tracker — GM tracker only: death saves section for player characters. */
  showDeathSaves?: boolean;
  /**
   * The full character is still loading: the dialog is already shown with the values the caller knows
   * (no loader swap), every control stays disabled until it arrives.
   */
  pending?: boolean;
}

const DEATH_SAVE_SLOTS = [0, 1, 2] as const;

/**
 * FR-combat-initiative-tracker — clicking a filled last slot clears it, any other slot fills up to it.
 */
export function nextDeathSaveCount(current: number, index: number): number {
  return current === index + 1 ? index : index + 1;
}

type HealthAction = "add" | "subtract" | "set";

function clampToNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function applyCurrentHpAction(character: Player | NPC, amount: number, action: HealthAction) {
  const maxHp = Math.max(0, character.stats.maxHitPoints ?? 0);
  const currentHp = Math.max(0, character.stats.currentHitPoints ?? 0);
  const tempHp = Math.max(0, character.stats.tempHitPoints ?? 0);

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
  character,
  characterType,
  sessionCode,
  onCharacterUpdate,
  showDeathSaves = false,
  pending = false,
}: SessionHealthDialogProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const toast = useToast();
  const [busyAction, setBusyAction] = useState<"current" | "temp" | "deathSaves" | null>(null);
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

  const locked = busyAction !== null || pending;

  const currentAmount = useMemo(() => clampToNonNegative(Number(currentHpValue)), [currentHpValue]);
  const tempAmount = useMemo(() => clampToNonNegative(Number(tempHpValue)), [tempHpValue]);
  const canApplyCurrent = currentHpValue.trim() !== "";
  const canApplyTemp = tempHpValue.trim() !== "";

  async function persistStats(nextCurrentHitPoints: number, nextTempHitPoints: number) {
    if (!onCharacterUpdate) {
      return;
    }

    const updated = await CharacterService.updateCharacter(
      characterType,
      character._id,
      {
        stats: {
          ...character.stats,
          currentHitPoints: nextCurrentHitPoints,
          tempHitPoints: nextTempHitPoints,
        },
      },
      sessionCode,
    );

    onCharacterUpdate(updated);
  }

  async function handleDeathSavesChange(next: DeathSaves) {
    if (locked || !onCharacterUpdate || !isPlayer(character)) {
      return;
    }

    setBusyAction("deathSaves");

    try {
      const updated = await CharacterService.updateCharacter(
        characterType,
        character._id,
        { deathSaves: next },
        sessionCode,
      );
      onCharacterUpdate(updated);
    } catch (error) {
      console.error(error);
      toast.error(t("sessionHpUpdateError"));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCurrentHpAction(action: HealthAction) {
    if (!canApplyCurrent || locked || !onCharacterUpdate) {
      return;
    }

    setBusyAction("current");

    try {
      const next = applyCurrentHpAction(character, currentAmount, action);
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
    if (!canApplyTemp || locked || !onCharacterUpdate) {
      return;
    }

    setBusyAction("temp");

    try {
      await persistStats(
        character.stats.currentHitPoints,
        Math.max(0, character.stats.tempHitPoints) + tempAmount,
      );
      setTempHpValue("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(t("sessionHpUpdateError"));
    } finally {
      setBusyAction(null);
    }
  }

  // FR-combat-initiative-tracker — death saves only matter at 0 HP: the section is hidden above it.
  const deathSaves: DeathSaves | null =
    showDeathSaves && isPlayer(character) && character.stats.currentHitPoints <= 0
      ? {
          successes: character.deathSaves?.successes ?? 0,
          failures: character.deathSaves?.failures ?? 0,
        }
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busyAction) {
          onOpenChange(nextOpen);
        }
      }}>
      <DialogContent
        // A death save toggle keeps the dialog chrome still (no close-button flicker).
        showCloseButton={busyAction === null || busyAction === "deathSaves"}
        className={`${DIALOG_SECTIONED_CONTENT_CLASS} flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col overflow-hidden`}>
        <DialogHeader className={DIALOG_SECTION_HEADER_CLASS}>
          <DialogTitle className={DIALOG_SECTION_TITLE_CLASS}>{t("sessionHpDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div
          className={`${DIALOG_SECTION_BODY_CLASS} grid min-h-0 gap-6 overflow-y-auto`}
          aria-busy={pending || undefined}>
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{t("sessionCurrentHpSection")}</h3>
              <p className="text-sm text-muted-foreground">
                {character.stats.currentHitPoints}/{character.stats.maxHitPoints}
                {character.stats.tempHitPoints > 0 ? ` (+${character.stats.tempHitPoints} ${t("hpAbbr")})` : ""}
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
                disabled={locked}
                className="h-9 min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-9 px-2 text-lg font-semibold"
                disabled={!canApplyCurrent || locked}
                aria-label={t("sessionSubtractCurrentHp")}
                onClick={() => void handleCurrentHpAction("subtract")}>
                {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                -
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-9 px-2 text-lg font-semibold"
                disabled={!canApplyCurrent || locked}
                aria-label={t("sessionAddCurrentHp")}
                onClick={() => void handleCurrentHpAction("add")}>
                {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                +
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-9 px-2 text-lg font-semibold"
                disabled={!canApplyCurrent || locked}
                aria-label={t("sessionSetCurrentHp")}
                onClick={() => void handleCurrentHpAction("set")}>
                {busyAction === "current" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                =
              </Button>
            </div>
          </section>

          <section className="grid gap-3">
            <button
              type="button"
              className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => setShowTempControls((current) => !current)}
              aria-expanded={showTempControls}>
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="text-base font-semibold">{t("sessionTempHpSection")}</h3>
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform ${showTempControls ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-muted-foreground">+{character.stats.tempHitPoints} {t("hpAbbr")}</p>
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
                  disabled={locked}
                  className="h-9 min-w-0 flex-1"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-w-9 px-2 text-lg font-semibold"
                  disabled={!canApplyTemp || locked}
                  aria-label={t("sessionAddTempHp")}
                  onClick={() => void handleAddTempHp()}>
                  {busyAction === "temp" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  +
                </Button>
              </div>
            ) : null}
          </section>

          {deathSaves ? (
            <section
              className="grid gap-3"
              aria-labelledby="session-hp-death-saves-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="session-hp-death-saves-heading"
                  className="text-base font-semibold">
                  {t("deathSaves")}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={locked || (deathSaves.successes === 0 && deathSaves.failures === 0)}
                  aria-label={t("resetDeathSaves")}
                  onClick={() => void handleDeathSavesChange({ successes: 0, failures: 0 })}>
                  <RefreshCcw aria-hidden="true" />
                  {tEdit("reset")}
                </Button>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                {(["successes", "failures"] as const).map((kind) => (
                  <DeathSaveRow
                    key={kind}
                    label={t(kind)}
                    count={deathSaves[kind]}
                    disabled={locked}
                    slotLabel={(index, selected) =>
                      t(kind === "successes" ? "deathSaveSuccessButton" : "deathSaveFailureButton", {
                        index: index + 1,
                        state: selected ? t("performedThrow") : t("unperformedThrow"),
                      })
                    }
                    onSelect={(index) =>
                      void handleDeathSavesChange({
                        ...deathSaves,
                        [kind]: nextDeathSaveCount(deathSaves[kind], index),
                      })
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeathSaveRowProps {
  label: string;
  count: number;
  disabled: boolean;
  slotLabel: (index: number, selected: boolean) => string;
  onSelect: (index: number) => void;
}

function DeathSaveRow({ label, count, disabled, slotLabel, onSelect }: DeathSaveRowProps) {
  return (
    <>
      <span className="text-sm">{label}</span>
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={label}>
        {DEATH_SAVE_SLOTS.map((index) => {
          const selected = index < count;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={slotLabel(index, selected)}
              onClick={() => onSelect(index)}
              className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40">
              <Image
                src={selected ? RedCircle : WhiteCircle}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
