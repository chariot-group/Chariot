import { NPC, Player } from "@/types/character";
import GP from "@public/assets/pieces/golden-piece.svg";
import SP from "@public/assets/pieces/silver-piece.svg";
import EP from "@public/assets/pieces/electrum-piece.svg";
import PP from "@public/assets/pieces/platinum-piece.svg";
import CP from "@public/assets/pieces/copper-piece.svg";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactNumber, formatNumberWithSpaces } from "@/utils/inventory.utils";
import { isPlayer } from "@/utils/global.utils";
import { useAppSelector } from "@/store/hooks";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { useMemo, useState } from "react";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CharacterInventoryViewProps {
  accentColor: string;
  character: Player | NPC;
  onCharacterUpdate?: (updated: Player | NPC) => void;
}

type CoinKey = "pp" | "gp" | "ep" | "sp" | "cp";
type CoinOperation = "add" | "subtract" | "set";
type TextFieldKey = "equipment" | "treasure";

const COIN_CONFIG: Array<{ key: CoinKey; labelKey: string; shortKey: string; icon: typeof PP }> = [
  { key: "pp", labelKey: "platinumPieces", shortKey: "pp", icon: PP },
  { key: "gp", labelKey: "goldPieces", shortKey: "gp", icon: GP },
  { key: "ep", labelKey: "electrumPieces", shortKey: "ep", icon: EP },
  { key: "sp", labelKey: "silverPieces", shortKey: "sp", icon: SP },
  { key: "cp", labelKey: "copperPieces", shortKey: "cp", icon: CP },
];

export default function CharacterInventoryView({
  accentColor,
  character,
  onCharacterUpdate,
}: CharacterInventoryViewProps) {
  const t = useTranslations("characterDetail.inventory");
  const toast = useToast();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useActiveSessionCode();
  const [selectedCoin, setSelectedCoin] = useState<CoinKey | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [editingField, setEditingField] = useState<TextFieldKey | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [busyState, setBusyState] = useState<"coin" | "text" | null>(null);

  const canEditInSession = isInSession && Boolean(onCharacterUpdate);
  const isEditingTextField = editingField !== null;
  const selectedCoinConfig = useMemo(
    () => COIN_CONFIG.find((coin) => coin.key === selectedCoin) ?? null,
    [selectedCoin],
  );

  function normalizeAmount(rawValue: string): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }

  async function updateTreasure(nextTreasure: Player["treasure"] | NPC["treasure"]) {
    if (!onCharacterUpdate) {
      return;
    }

    const updated = await CharacterService.updateCharacter(
      isPlayer(character) ? "players" : "npcs",
      character._id,
      { treasure: nextTreasure },
      sessionCode,
    );
    onCharacterUpdate(updated);
  }

  async function handleCoinAction(operation: CoinOperation) {
    if (!selectedCoinConfig || !onCharacterUpdate || busyState) {
      return;
    }

    const amount = normalizeAmount(coinAmount);
    const currentValue = Math.max(0, character.treasure[selectedCoinConfig.key] ?? 0);
    let nextValue = currentValue;

    if (operation === "add") {
      nextValue = currentValue + amount;
    }

    if (operation === "subtract") {
      nextValue = Math.max(0, currentValue - amount);
    }

    if (operation === "set") {
      nextValue = amount;
    }

    setBusyState("coin");
    try {
      await updateTreasure({
        ...character.treasure,
        [selectedCoinConfig.key]: nextValue,
      });
      setCoinAmount("");
      setSelectedCoin(null);
    } catch (error) {
      console.error(error);
      toast.error(t("sessionInventoryUpdateError"));
    } finally {
      setBusyState(null);
    }
  }

  function openTextEditor(field: TextFieldKey) {
    setEditingField(field);
    setTextDraft(character.treasure[field] ?? "");
  }

  async function handleTextSave() {
    if (!editingField || !onCharacterUpdate || busyState) {
      return;
    }

    setBusyState("text");
    try {
      await updateTreasure({
        ...character.treasure,
        [editingField]: textDraft,
      });
      setEditingField(null);
      setTextDraft("");
    } catch (error) {
      console.error(error);
      toast.error(t("sessionInventoryUpdateError"));
    } finally {
      setBusyState(null);
    }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-2 md:gap-4 items-start">
      <div className="flex flex-col gap-2 md:gap-4 w-full lg:w-2/5">
        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="coins-heading"
            className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
            {t("coins")}
          </h2>
          <div className="grid w-full grid-cols-2 gap-3 md:max-lg:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-5">
            {COIN_CONFIG.map((coin) => {
              const value = character?.treasure[coin.key] ?? 0;
              const tooltipLabel = `${formatNumberWithSpaces(value)} ${t(coin.labelKey as Parameters<typeof t>[0])}`;
              const content = (
                <>
                  <Image
                    src={coin.icon}
                    alt=""
                    aria-hidden="true"
                    className="size-4 shrink-0 sm:size-5"
                  />
                  <span
                    aria-hidden="true"
                    className="whitespace-nowrap">
                    {formatCompactNumber(value)} {t(coin.shortKey as Parameters<typeof t>[0])}
                  </span>
                </>
              );

              return (
                <Tooltip key={coin.key}>
                  <TooltipTrigger asChild>
                    {canEditInSession ? (
                      <button
                        type="button"
                        className="flex w-full flex-row items-center justify-center gap-1 rounded-[15px] border border-border/60 bg-background/60 px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary sm:text-base 2xl:gap-2"
                        aria-label={`${tooltipLabel}. ${t("editCoinAmountAria", { coin: t(coin.labelKey as Parameters<typeof t>[0]) })}`}
                        aria-haspopup="dialog"
                        onClick={() => setSelectedCoin(coin.key)}>
                        {content}
                      </button>
                    ) : (
                      <span
                        className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                        role="text"
                        tabIndex={0}
                        aria-label={tooltipLabel}>
                        {content}
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipLabel}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </Card>
        <Card className="gap-3 py-4 px-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="equipment-heading"
              className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
              {t("equipment")}
            </h2>
            {canEditInSession && !isEditingTextField ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => openTextEditor("equipment")}>
                <Pencil className="size-4" aria-hidden />
                {t("editField")}
              </Button>
            ) : null}
          </div>
          {editingField === "equipment" ? (
            <div className="flex flex-col gap-3">
              <Textarea
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                placeholder={t("equipment")}
                disabled={busyState !== null}
                className="min-h-28"
              />
              <div className="flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyState !== null}
                  onClick={() => {
                    setEditingField(null);
                    setTextDraft("");
                  }}>
                  {t("cancelEdit")}
                </Button>
                <Button
                  type="button"
                  disabled={busyState !== null}
                  onClick={() => void handleTextSave()}>
                  {busyState === "text" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {t("saveField")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
              {character?.treasure.equipment || t("noEquipment")}
            </p>
          )}
        </Card>
      </div>
      <Card className="w-full lg:min-w-3/5 lg:max-w-3/5 gap-3 py-4 px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
            <h2
              id="treasure-heading"
              className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
              {t("treasure")}
            </h2>
          {canEditInSession && !isEditingTextField ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => openTextEditor("treasure")}>
              <Pencil className="size-4" aria-hidden />
              {t("editField")}
            </Button>
          ) : null}
        </div>
        {editingField === "treasure" ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={textDraft}
              onChange={(event) => setTextDraft(event.target.value)}
              placeholder={t("treasure")}
              disabled={busyState !== null}
              className="min-h-36"
            />
            <div className="flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busyState !== null}
                onClick={() => {
                  setEditingField(null);
                  setTextDraft("");
                }}>
                {t("cancelEdit")}
              </Button>
              <Button
                type="button"
                disabled={busyState !== null}
                onClick={() => void handleTextSave()}>
                {busyState === "text" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {t("saveField")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
            {character?.treasure.treasure || t("noTreasure")}
          </p>
        )}
      </Card>

      <Dialog
        open={selectedCoin !== null}
        onOpenChange={(open) => {
          if (!busyState) {
            setSelectedCoin(open ? selectedCoin : null);
            if (!open) {
              setCoinAmount("");
            }
          }
        }}>
        <DialogContent
          showCloseButton={busyState !== "coin"}
          className="max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {selectedCoinConfig ? t("editCoinDialogTitle", { coin: t(selectedCoinConfig.labelKey as Parameters<typeof t>[0]) }) : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedCoinConfig
                ? t("editCoinDialogDescription", {
                    value: formatNumberWithSpaces(character.treasure[selectedCoinConfig.key] ?? 0),
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={coinAmount}
              onChange={(event) => setCoinAmount(event.target.value)}
              placeholder={t("coinAmountPlaceholder")}
              aria-label={t("coinAmountPlaceholder")}
              disabled={busyState !== null}
              className="h-9 min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={coinAmount.trim() === "" || busyState !== null}
              aria-label={t("subtractCoins")}
              onClick={() => void handleCoinAction("subtract")}>
              {busyState === "coin" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              -
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={coinAmount.trim() === "" || busyState !== null}
              aria-label={t("addCoins")}
              onClick={() => void handleCoinAction("add")}>
              {busyState === "coin" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              +
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-9 px-2 text-lg font-semibold"
              disabled={coinAmount.trim() === "" || busyState !== null}
              aria-label={t("setCoins")}
              onClick={() => void handleCoinAction("set")}>
              {busyState === "coin" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              =
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
