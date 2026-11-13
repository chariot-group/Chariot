import { NPC, Player } from "@/types/character";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatCompactNumber, formatNumberWithSpaces } from "@/utils/inventory.utils";
import { isPlayer } from "@/utils/global.utils";
import { useAppSelector } from "@/store/hooks";
import { selectIsSessionLaunched } from "@/store/slices/sessionSlice";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { useMemo, useState } from "react";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import { BENTO_BOUNDED_LIST_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";
import {
  INVENTORY_BENTO_GRID_CLASS,
  INVENTORY_SLOTS,
} from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
import {
  COIN_CONFIG,
  nextCoinValue,
  type CoinKey,
  type CoinOperation,
} from "@/components/character/tabContents/inventory/shared/coins";

interface CharacterInventoryViewProps {
  accentColor: string;
  character: Player | NPC;
  onCharacterUpdate?: (updated: Player | NPC) => void;
}

type TextFieldKey = "equipment" | "treasure";

const EMPTY_LABEL_KEYS = { equipment: "noEquipment", treasure: "noTreasure" } as const;

/** Coins always sit on one row: fact cells without delimiter (FR-character-statistics-card). */
const COIN_CELL_CLASS = "flex min-w-0 flex-col gap-0.5";

/**
 * One coin of the coins strip: icon + short label, then the (abbreviated) value.
 * In session it is a button opening the coin dialog; otherwise it is a static, non-focusable cell.
 * @see FR-character-inventory-bento-layout
 */
function CoinCell({
  coin,
  value,
  onSelect,
}: {
  coin: (typeof COIN_CONFIG)[number];
  value: number;
  onSelect?: () => void;
}) {
  const t = useTranslations("characterDetail.inventory");
  const fullLabel = `${formatNumberWithSpaces(value)} ${t(coin.labelKey)}`;
  const content = (
    <>
      <span
        className="flex min-w-0 items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground"
        aria-hidden="true">
        <Image
          src={coin.icon}
          alt=""
          className="size-4 shrink-0 sm:size-5"
        />
        <span className="truncate">{t(coin.shortKey)}</span>
      </span>
      <span
        className="max-w-full truncate text-base font-bold tabular-nums sm:text-lg"
        aria-hidden="true">
        {formatCompactNumber(value)}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={cn(
          COIN_CELL_CLASS,
          "rounded-[10px] p-1.5 text-left transition-colors hover:bg-gray-middle-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`${fullLabel}. ${t("editCoinAmountAria", { coin: t(coin.labelKey) })}`}
        aria-haspopup="dialog"
        onClick={onSelect}>
        {content}
      </button>
    );
  }

  const cell = (
    <div
      className={COIN_CELL_CLASS}
      role="group"
      aria-label={fullLabel}>
      {content}
    </div>
  );

  // The full value is only hidden when abbreviated (≥ 1 000).
  return value >= 1000 ? (
    <InfoTooltip
      content={<p>{fullLabel}</p>}
      moreInfoLabel={fullLabel}
      helpPlacement="corner"
      className="min-w-0 [&>[role=group]]:w-full [&>[role=group]]:cursor-help">
      {cell}
    </InfoTooltip>
  ) : (
    cell
  );
}

/**
 * Free-text card (equipment, treasure): bounded text, with the in-session inline editor.
 * @see FR-character-inventory-bento-layout
 */
function InventoryTextCard({
  field,
  value,
  accentColor,
  className,
  canEdit,
  isEditing,
  draft,
  busy,
  onEdit,
  onDraftChange,
  onCancel,
  onSave,
}: {
  field: TextFieldKey;
  value: string | undefined;
  accentColor: string;
  className: string;
  canEdit: boolean;
  isEditing: boolean;
  draft: string;
  busy: "coin" | "text" | null;
  onEdit: () => void;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("characterDetail.inventory");
  const headingId = `${field}-heading`;
  const editorId = `inventory-session-${field}`;

  return (
    <GeneralSectionCard
      headingId={headingId}
      title={t(field)}
      accentColor={accentColor}
      className={className}
      headerAction={
        canEdit ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            aria-label={`${t("editField")} : ${t(field)}`}
            onClick={onEdit}>
            <Pencil
              className="size-4"
              aria-hidden
            />
            {t("editField")}
          </Button>
        ) : null
      }>
      {isEditing ? (
        <div className="flex flex-1 flex-col gap-3">
          <label
            htmlFor={editorId}
            className="sr-only">
            {t(field)}
          </label>
          <Textarea
            id={editorId}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t(field)}
            disabled={busy !== null}
            className="min-h-36 flex-1 resize-none"
          />
          <div className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={onCancel}>
              {t("cancelEdit")}
            </Button>
            <Button
              type="button"
              disabled={busy !== null}
              onClick={onSave}>
              {busy === "text" ? (
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden
                />
              ) : null}
              {t("saveField")}
            </Button>
          </div>
        </div>
      ) : value ? (
        <div
          className={BENTO_BOUNDED_LIST_CLASS}
          role="group"
          aria-labelledby={headingId}
          tabIndex={0}>
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{value}</p>
        </div>
      ) : (
        <p className="text-sm md:text-base text-muted-foreground">{t(EMPTY_LABEL_KEYS[field])}</p>
      )}
    </GeneralSectionCard>
  );
}

/**
 * Inventory tab, read mode: coins strip, then equipment and treasure side by side.
 * @see FR-character-inventory-bento-layout
 */
export default function CharacterInventoryView({
  accentColor,
  character,
  onCharacterUpdate,
}: CharacterInventoryViewProps) {
  const t = useTranslations("characterDetail.inventory");
  const toast = useToast();
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const sessionCode = useActiveSessionCode();
  const [selectedCoin, setSelectedCoin] = useState<CoinKey | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [editingField, setEditingField] = useState<TextFieldKey | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [busyState, setBusyState] = useState<"coin" | "text" | null>(null);

  const canEditInSession = isSessionLaunched && Boolean(onCharacterUpdate);
  const isEditingTextField = editingField !== null;
  const selectedCoinConfig = useMemo(
    () => COIN_CONFIG.find((coin) => coin.key === selectedCoin) ?? null,
    [selectedCoin],
  );

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

    const nextValue = nextCoinValue(character.treasure[selectedCoinConfig.key] ?? 0, coinAmount, operation);

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

  function closeTextEditor() {
    setEditingField(null);
    setTextDraft("");
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
      closeTextEditor();
    } catch (error) {
      console.error(error);
      toast.error(t("sessionInventoryUpdateError"));
    } finally {
      setBusyState(null);
    }
  }

  const textCardProps = (field: TextFieldKey) => ({
    field,
    value: character?.treasure[field],
    accentColor,
    className: INVENTORY_SLOTS[field],
    canEdit: canEditInSession && !isEditingTextField,
    isEditing: editingField === field,
    draft: textDraft,
    busy: busyState,
    onEdit: () => openTextEditor(field),
    onDraftChange: setTextDraft,
    onCancel: closeTextEditor,
    onSave: () => void handleTextSave(),
  });

  return (
    <div className={INVENTORY_BENTO_GRID_CLASS}>
      <GeneralSectionCard
        headingId="coins-heading"
        title={t("coins")}
        accentColor={accentColor}
        className={cn(INVENTORY_SLOTS.coins, "justify-between")}>
        <div className="grid min-w-0 grid-cols-3 gap-x-2 gap-y-3 @sm:grid-cols-5 @sm:gap-x-1.5 @sm:gap-y-0">
          {COIN_CONFIG.map((coin) => (
            <CoinCell
              key={coin.key}
              coin={coin}
              value={character?.treasure[coin.key] ?? 0}
              onSelect={canEditInSession ? () => setSelectedCoin(coin.key) : undefined}
            />
          ))}
        </div>
      </GeneralSectionCard>
      <InventoryTextCard {...textCardProps("equipment")} />
      <InventoryTextCard {...textCardProps("treasure")} />

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
              {selectedCoinConfig ? t("editCoinDialogTitle", { coin: t(selectedCoinConfig.labelKey) }) : ""}
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
            {(
              [
                { operation: "subtract", labelKey: "subtractCoins", symbol: "−" },
                { operation: "add", labelKey: "addCoins", symbol: "+" },
                { operation: "set", labelKey: "setCoins", symbol: "=" },
              ] as const
            ).map(({ operation, labelKey, symbol }) => (
              <Button
                key={operation}
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-9 px-2 text-lg font-semibold"
                disabled={coinAmount.trim() === "" || busyState !== null}
                aria-label={t(labelKey)}
                onClick={() => void handleCoinAction(operation)}>
                {busyState === "coin" ? (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden
                  />
                ) : null}
                {symbol}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
