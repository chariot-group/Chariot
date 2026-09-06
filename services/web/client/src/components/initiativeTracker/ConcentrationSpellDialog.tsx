"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildTrackerConcentration,
  listConcentrationSpellsFromCharacter,
} from "@/components/initiativeTracker/concentration.utils";
import { cn } from "@/lib/utils";
import type { InitiativeTrackerRow, TrackerConcentration } from "@/store/slices/sessionSlice";
import CharacterService from "@/services/CharacterService";

export type ConcentrationDialogIntent = "set" | "replace" | "rename";

type ConcentrationSpellDialogProps = {
  row: InitiativeTrackerRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: ConcentrationDialogIntent;
  currentRound: number;
  sessionCode?: string | null;
  onSetConcentration: (concentration: TrackerConcentration | null) => void;
};

type DialogTab = "replace" | "rename";

export function ConcentrationSpellDialog({
  row,
  open,
  onOpenChange,
  intent,
  currentRound,
  sessionCode,
  onSetConcentration,
}: ConcentrationSpellDialogProps) {
  const t = useTranslations("initTracker.tracker.concentration");
  const hasActiveConcentration = Boolean(row.concentration);
  const [activeTab, setActiveTab] = React.useState<DialogTab>("replace");
  const [loadingSpells, setLoadingSpells] = React.useState(false);
  const [customSpellName, setCustomSpellName] = React.useState("");
  const [renameSpellName, setRenameSpellName] = React.useState("");
  const [spellOptions, setSpellOptions] = React.useState<
    Array<{ spellName: string; spellLevel: number; className: string }>
  >([]);

  const closeDialog = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (!justOpened) return;

    setActiveTab(intent === "rename" ? "rename" : "replace");
    setCustomSpellName("");
    setRenameSpellName(row.concentration?.spellName ?? "");
  }, [intent, open, row.concentration?.spellName]);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingSpells(true);

    void CharacterService.getCharacterById(row.characterId, { sessionCode })
      .then((character) => {
        if (cancelled) return;
        const options = listConcentrationSpellsFromCharacter(character.spellcasting).map(({ spell, className }) => ({
          spellName: spell.name,
          spellLevel: spell.level,
          className,
        }));
        setSpellOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setSpellOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSpells(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, row.characterId, sessionCode]);

  const applyReplacement = (input: {
    spellName: string;
    spellLevel?: number;
    className?: string;
  }) => {
    closeDialog();
    onSetConcentration(
      buildTrackerConcentration({
        ...input,
        sinceRound: currentRound,
      }),
    );
  };

  const applyNpcCustom = () => {
    const spellName = customSpellName.trim();
    if (!spellName) return;
    applyReplacement({ spellName });
  };

  const applyRename = () => {
    const spellName = renameSpellName.trim();
    if (!spellName) return;

    closeDialog();
    onSetConcentration(
      buildTrackerConcentration({
        spellName,
        spellLevel: row.concentration?.spellLevel,
        className: row.concentration?.className,
        sinceRound: row.concentration?.sinceRound ?? currentRound,
      }),
    );
  };

  const showTabs = hasActiveConcentration && intent !== "set";
  const showReplacePanel = !showTabs || activeTab === "replace";
  const hasSpellList = spellOptions.length > 0;
  const dialogTitle =
    intent === "rename"
      ? t("renameDialogTitle")
      : hasActiveConcentration
        ? t("replaceDialogTitle")
        : t("dialogTitle");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[15px] bg-card">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {!showTabs && !hasSpellList && !loadingSpells ? (
            <DialogDescription>{t("noSpellsFound")}</DialogDescription>
          ) : null}
        </DialogHeader>

        {showTabs ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DialogTab)}
            className="gap-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-[15px] border border-white/10 bg-gray-middle-light/80 p-1">
              <TabsTrigger
                value="replace"
                className="rounded-[12px] border border-transparent px-3 py-2.5 text-sm font-medium text-white/55 transition-all data-[state=active]:border-pink/50 data-[state=active]:bg-pink/15 data-[state=active]:text-pink data-[state=active]:shadow-sm">
                {t("tabReplace")}
              </TabsTrigger>
              <TabsTrigger
                value="rename"
                className="rounded-[12px] border border-transparent px-3 py-2.5 text-sm font-medium text-white/55 transition-all data-[state=active]:border-pink/50 data-[state=active]:bg-pink/15 data-[state=active]:text-pink data-[state=active]:shadow-sm">
                {t("tabRename")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}

        {loadingSpells ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="size-8 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : showReplacePanel ? (
          <div className="flex flex-col gap-4 py-2">
            {hasSpellList ? (
              <div className="flex max-h-52 flex-col gap-2 overflow-y-auto">
                {spellOptions.map((option) => (
                  <Button
                    key={`${option.className}:${option.spellName}:${option.spellLevel}`}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start rounded-[15px] px-3 py-2 text-left"
                    onClick={() => applyReplacement(option)}>
                    <span className="block text-sm font-medium text-white">{option.spellName}</span>
                    <span className="block text-xs text-white/60">
                      {t("spellMeta", {
                        level: option.spellLevel,
                        className: option.className,
                      })}
                    </span>
                  </Button>
                ))}
              </div>
            ) : null}

            <div className={cn("flex flex-col gap-2", hasSpellList && "border-t border-white/10 pt-4")}>
              <Label htmlFor={`concentration-custom-${row.id}`}>
                {hasSpellList ? t("otherSpellLabel") : t("customName")}
              </Label>
              {hasSpellList ? (
                <p className="text-xs text-white/60">{t("otherSpellHint")}</p>
              ) : null}
              <Input
                id={`concentration-custom-${row.id}`}
                value={customSpellName}
                onChange={(event) => setCustomSpellName(event.target.value)}
                placeholder={t("customNamePlaceholder")}
                className="rounded-[15px] bg-gray-middle-light text-white"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyNpcCustom();
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor={`concentration-rename-${row.id}`}>{t("renameLabel")}</Label>
            <p className="text-xs text-white/60">{t("renameHint")}</p>
            <Input
              id={`concentration-rename-${row.id}`}
              value={renameSpellName}
              onChange={(event) => setRenameSpellName(event.target.value)}
              placeholder={t("customNamePlaceholder")}
              className="rounded-[15px] bg-gray-middle-light text-white"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyRename();
                }
              }}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}>
            {t("cancel")}
          </Button>
          {showReplacePanel ? (
            <Button
              type="button"
              disabled={!customSpellName.trim()}
              onClick={applyNpcCustom}>
              {t("confirm")}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!renameSpellName.trim()}
              onClick={applyRename}>
              {t("saveRename")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
