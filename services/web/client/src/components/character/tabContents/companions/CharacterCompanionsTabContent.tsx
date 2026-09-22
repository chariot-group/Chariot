"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Link2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CharacterService from "@/services/CharacterService";
import { characterDisplayName } from "@/lib/duplicateName";
import {
  applyCompanionLinkChange,
  linkedPlayerIdOf,
  playerSpaceNpcsForLinkPicker,
  queueCompanionLinkOp,
  type CompanionLinkOp,
} from "@/lib/npcPlayerLink";
import { useAppDispatch } from "@/store/hooks";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { CompanionNpcCard } from "@/components/character/tabContents/companions/CompanionNpcCard";
import { showToast } from "@/lib/toast";
import type { NPC, Player } from "@/types/character";
import { cn } from "@/lib/utils";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";

interface CharacterCompanionsTabContentProps {
  player: Player;
  isEditing: boolean;
  onPendingChange?: (pending: boolean) => void;
  persistRef?: MutableRefObject<(() => Promise<void>) | null>;
  revertRef?: MutableRefObject<(() => void) | null>;
}

/**
 * @see FR-npc-player-link — link/unlink persist only when the Player form is saved.
 */
export default function CharacterCompanionsTabContent({
  player,
  isEditing,
  onPendingChange,
  persistRef,
  revertRef,
}: CharacterCompanionsTabContentProps) {
  const t = useTranslations("characterDetail.companions");
  const tRef = useRef(t);
  const sessionCode = useActiveSessionCode();
  tRef.current = t;
  const dispatch = useAppDispatch();
  const playerId = player._id;
  const [savedCompanions, setSavedCompanions] = useState<NPC[]>([]);
  const [companions, setCompanions] = useState<NPC[]>([]);
  const [pendingOps, setPendingOps] = useState<CompanionLinkOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkedNpcs, setUnlinkedNpcs] = useState<NPC[]>([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const originalByIdRef = useRef(new Map<string, string | null>());
  const pendingOpsRef = useRef<CompanionLinkOp[]>([]);
  const companionsRef = useRef<NPC[]>([]);
  const savedCompanionsRef = useRef<NPC[]>([]);
  pendingOpsRef.current = pendingOps;
  companionsRef.current = companions;
  savedCompanionsRef.current = savedCompanions;
  const onPendingChangeRef = useRef(onPendingChange);
  onPendingChangeRef.current = onPendingChange;

  useEffect(() => {
    onPendingChangeRef.current?.(pendingOps.length > 0);
  }, [pendingOps]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void CharacterService.getNpcsByLinkedPlayers([playerId])
      .then((linked) => {
        if (cancelled) return;
        const originals = new Map<string, string | null>();
        for (const npc of linked) {
          if (npc._id) originals.set(npc._id, linkedPlayerIdOf(npc));
        }
        originalByIdRef.current = originals;
        setSavedCompanions(linked);
        setCompanions(linked);
        setPendingOps([]);
      })
      .catch(() => {
        if (!cancelled) {
          showToast(tRef.current("loadError"), "error", { toastId: "companions-load-error" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const queueDraft = useCallback(
    (npc: NPC, linkedPlayerId: string | null) => {
      const original = originalByIdRef.current.get(npc._id) ?? linkedPlayerIdOf(npc);
      const updated = { ...npc, linkedPlayerId } as NPC;
      setCompanions((current) => applyCompanionLinkChange(current, updated, playerId));
      setPendingOps((current) => queueCompanionLinkOp(current, npc, linkedPlayerId, original));
      if (linkedPlayerId) {
        setUnlinkedNpcs((current) => current.filter((item) => item._id !== npc._id));
      } else {
        setUnlinkedNpcs((current) =>
          current.some((item) => item._id === npc._id) ? current : [...current, { ...npc, linkedPlayerId: null }],
        );
      }
      setLinkOpen(false);
    },
    [playerId],
  );

  const persist = useCallback(async () => {
    const ops = pendingOpsRef.current;
    if (ops.length === 0) return;

    setIsPersisting(true);
    try {
      const persisted: NPC[] = [];
      for (const op of ops) {
        const updated = (await CharacterService.updateCharacter("npcs", op.npc._id, {
          linkedPlayerId: op.linkedPlayerId,
        })) as NPC;
        dispatch(upsertPlayerSpaceNpc(updated));
        persisted.push(updated);
        originalByIdRef.current.set(updated._id, linkedPlayerIdOf(updated));
      }
      let nextCompanions = savedCompanionsRef.current;
      for (const updated of persisted) {
        nextCompanions = applyCompanionLinkChange(nextCompanions, updated, playerId);
      }
      setSavedCompanions(nextCompanions);
      setCompanions(nextCompanions);
      setPendingOps([]);
    } finally {
      setIsPersisting(false);
    }
  }, [dispatch, playerId]);

  const revert = useCallback(() => {
    setCompanions(savedCompanionsRef.current);
    setPendingOps([]);
    setLinkOpen(false);
  }, []);

  useEffect(() => {
    if (persistRef) persistRef.current = persist;
    if (revertRef) revertRef.current = revert;
    return () => {
      if (persistRef) persistRef.current = null;
      if (revertRef) revertRef.current = null;
    };
  }, [persist, persistRef, revert, revertRef]);

  const openLinkDialog = useCallback(async () => {
    setLinkOpen(true);
    setLoadingUnlinked(true);
    try {
      const response = await CharacterService.getUnlinkedNpcsWithoutGroup(1, 50);
      const picker = playerSpaceNpcsForLinkPicker((response.data ?? []) as NPC[]).filter(
        (npc) => !companionsRef.current.some((companion) => companion._id === npc._id),
      );
      for (const npc of picker) {
        if (npc._id && !originalByIdRef.current.has(npc._id)) {
          originalByIdRef.current.set(npc._id, linkedPlayerIdOf(npc));
        }
      }
      setUnlinkedNpcs(picker);
    } catch {
      showToast(tRef.current("loadError"), "error", { toastId: "companions-unlinked-load-error" });
      setUnlinkedNpcs([]);
    } finally {
      setLoadingUnlinked(false);
    }
  }, []);

  const unnamed = t("unnamedNpc");
  const sortedCompanions = useMemo(
    () =>
      [...companions].sort((left, right) =>
        characterDisplayName(left).localeCompare(characterDisplayName(right), undefined, { sensitivity: "base" }),
      ),
    [companions],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2
          className="h-6 w-6 animate-spin text-white/70"
          aria-hidden="true"
        />
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  return (
    <section
      className="flex flex-col gap-4"
      aria-label={t("title")}>
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void openLinkDialog()}
            aria-label={t("linkExisting")}
            className="cursor-pointer">
            <Link2
              className="size-4"
              aria-hidden="true"
            />
            {t("linkExisting")}
          </Button>
          <CreateCharacterDialog
            npcOnly
            linkedPlayerId={playerId}>
            <Button
              type="button"
              aria-label={t("createLinked")}
              className={cn("cursor-pointer bg-purple text-white hover:bg-purple/80")}>
              <UserPlus
                className="size-4"
                aria-hidden="true"
              />
              {t("createLinked")}
            </Button>
          </CreateCharacterDialog>
        </div>
      ) : null}

      {sortedCompanions.length === 0 ? (
        <p className="text-sm text-white/70">{t("empty")}</p>
      ) : (
        <ul className="grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {sortedCompanions.map((npc) => (
            <li
              key={npc._id}
              className="min-w-0 h-full">
              <CompanionNpcCard
                npc={npc}
                unnamedFallback={unnamed}
                isEditing={isEditing}
                isPersisting={isPersisting}
                sessionCode={sessionCode}
                onUnlink={(companion) => queueDraft(companion, null)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={linkOpen}
        onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("linkDialogTitle")}</DialogTitle>
            <DialogDescription>{t("linkDialogDescription")}</DialogDescription>
          </DialogHeader>
          {loadingUnlinked ? (
            <div className="flex justify-center py-4">
              <Loader2
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
            </div>
          ) : unlinkedNpcs.length === 0 ? (
            <p className="text-sm text-white/70">{t("noUnlinkedNpcs")}</p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
              {unlinkedNpcs.map((npc) => {
                const name = characterDisplayName(npc) || unnamed;
                return (
                  <li key={npc._id}>
                    <button
                      type="button"
                      disabled={isPersisting}
                      onClick={() => queueDraft(npc, playerId)}
                      className="flex w-full cursor-pointer items-center rounded-[12px] px-3 py-2 text-left text-sm text-white hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/50 disabled:opacity-50">
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkOpen(false)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
