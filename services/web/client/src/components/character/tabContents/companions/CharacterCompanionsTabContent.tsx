"use client";

import { CompanionsTabSkeleton } from "@/components/character/skeleton/CharacterSheetSkeleton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { sortCompanionsByDisplayName } from "@/lib/sessionPlayerCompanions";
import {
  applyCompanionLinkChange,
  persistSidebarNpcLinkedPlayer,
  playerSpaceNpcsForLinkPicker,
} from "@/lib/npcPlayerLink";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { selectIsSessionLaunched, selectSessionCode, selectSessionCompanionNpcs } from "@/store/slices/sessionSlice";
import { normalizeCharacterId } from "@/lib/normalizeCharacterId";
import { companionsOfPlayer } from "@/lib/sessionPlayerCompanions";
import { CompanionNpcCard } from "@/components/character/tabContents/companions/CompanionNpcCard";
import { CompanionsEmptyState } from "@/components/character/tabContents/companions/view/CompanionsEmptyState";
import {
  COMPANIONS_BENTO_GRID_CLASS,
  COMPANIONS_SLOTS,
} from "@/components/character/tabContents/companions/shared/companionsBentoLayout";
import { showToast } from "@/lib/toast";
import type { NPC, Player } from "@/types/character";
import { cn } from "@/lib/utils";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";

interface CharacterCompanionsTabContentProps {
  player: Player;
  /** Session GM may list companions but MUST NOT manage liaisons. @see FR-session-player-companion-combatants */
  liaisonActionsEnabled?: boolean;
}

/**
 * @see FR-npc-player-link — liaisons persist immediately (same as FR-sidebar-npc-link).
 * @see FR-session-player-companion-combatants
 */
export default function CharacterCompanionsTabContent({
  player,
  liaisonActionsEnabled = true,
}: CharacterCompanionsTabContentProps) {
  const t = useTranslations("characterDetail.companions");
  const tSidebar = useTranslations("sidebar");
  const tRef = useRef(t);
  const sessionCodeFromUrl = useActiveSessionCode();
  tRef.current = t;
  const dispatch = useAppDispatch();
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const reduxSessionCode = useAppSelector(selectSessionCode);
  const sessionCompanionNpcs = useAppSelector(selectSessionCompanionNpcs);
  const playerId = normalizeCharacterId(player._id) ?? player._id;
  const sessionCodeForLookup = sessionCodeFromUrl ?? (isSessionLaunched ? reduxSessionCode?.trim() || null : null);
  const canManageLiaisons = liaisonActionsEnabled;
  const showLiaisonActions = canManageLiaisons;
  const derivedSessionCompanions = useMemo(
    () => (canManageLiaisons ? [] : companionsOfPlayer(sessionCompanionNpcs, playerId)),
    [canManageLiaisons, playerId, sessionCompanionNpcs],
  );
  const [companions, setCompanions] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkedNpcs, setUnlinkedNpcs] = useState<NPC[]>([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const companionsRef = useRef<NPC[]>([]);
  companionsRef.current = companions;

  useEffect(() => {
    let cancelled = false;

    const applyCompanionList = (linked: NPC[]) => {
      setCompanions(linked);
    };

    if (!canManageLiaisons) {
      if (derivedSessionCompanions.length > 0) {
        applyCompanionList(derivedSessionCompanions);
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (!sessionCodeForLookup) {
        if (derivedSessionCompanions.length === 0 && !cancelled) {
          setLoading(false);
        }
        return () => {
          cancelled = true;
        };
      }

      void CharacterService.getNpcsByLinkedPlayers([playerId], {
        sessionCode: sessionCodeForLookup,
      })
        .then((linked) => {
          if (cancelled) return;
          if (linked.length > 0) {
            applyCompanionList(linked);
            return;
          }
          if (derivedSessionCompanions.length > 0) {
            applyCompanionList(derivedSessionCompanions);
          }
        })
        .catch(() => {
          if (!cancelled) {
            if (derivedSessionCompanions.length > 0) {
              applyCompanionList(derivedSessionCompanions);
            } else {
              showToast(tRef.current("loadError"), "error", { toastId: "companions-load-error" });
            }
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void CharacterService.getNpcsByLinkedPlayers([playerId], { sessionCode: null })
      .then((linked) => {
        if (!cancelled) applyCompanionList(linked);
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
  }, [canManageLiaisons, derivedSessionCompanions, playerId, sessionCodeForLookup]);

  const persistNpcLink = useCallback(
    async (npc: NPC, linkedPlayerId: string | null) => {
      if (isLinking) return;
      setIsLinking(true);
      try {
        const updated = await persistSidebarNpcLinkedPlayer(
          npc,
          linkedPlayerId,
          (id, payload) => CharacterService.updateCharacter("npcs", id, payload) as Promise<NPC>,
        );
        dispatch(upsertPlayerSpaceNpc(updated));
        setCompanions((current) => applyCompanionLinkChange(current, updated, playerId));
        showToast(linkedPlayerId ? tSidebar("linkNpcSuccess") : tSidebar("unlinkNpcSuccess"), "success");
        if (linkedPlayerId) {
          setUnlinkedNpcs((current) => current.filter((item) => item._id !== npc._id));
          setLinkOpen(false);
        }
      } catch {
        showToast(linkedPlayerId ? tSidebar("linkNpcError") : tSidebar("unlinkNpcError"), "error");
      } finally {
        setIsLinking(false);
      }
    },
    [dispatch, isLinking, playerId, tSidebar],
  );

  const openLinkDialog = useCallback(async () => {
    setLinkOpen(true);
    setLoadingUnlinked(true);
    try {
      const response = await CharacterService.getUnlinkedNpcsWithoutGroup(1, 50);
      const picker = playerSpaceNpcsForLinkPicker((response.data ?? []) as NPC[]).filter(
        (npc) => !companionsRef.current.some((companion) => companion._id === npc._id),
      );
      setUnlinkedNpcs(picker);
    } catch {
      showToast(tRef.current("loadError"), "error", { toastId: "companions-unlinked-load-error" });
      setUnlinkedNpcs([]);
    } finally {
      setLoadingUnlinked(false);
    }
  }, []);

  const unnamed = t("unnamedNpc");
  const sortedCompanions = useMemo(() => sortCompanionsByDisplayName(companions), [companions]);

  if (loading) {
    return (
      <CompanionsTabSkeleton
        showActions={showLiaisonActions}
        label={t("loading")}
      />
    );
  }

  const liaisonActions = showLiaisonActions ? (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => void openLinkDialog()}
        disabled={isLinking}>
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
          variant="primary"
          disabled={isLinking}>
          <UserPlus
            className="size-4"
            aria-hidden="true"
          />
          {t("createLinked")}
        </Button>
      </CreateCharacterDialog>
    </>
  ) : null;

  return (
    <section
      className={COMPANIONS_BENTO_GRID_CLASS}
      aria-label={t("title")}>
      {sortedCompanions.length === 0 ? (
        <CompanionsEmptyState actions={liaisonActions} />
      ) : (
        <>
          {liaisonActions ? (
            <div className={cn(COMPANIONS_SLOTS.toolbar, "flex flex-wrap gap-2")}>{liaisonActions}</div>
          ) : null}
          {/* `contents`: each item is a grid child; `role="list"` keeps the list semantics in Safari */}
          <ul
            role="list"
            aria-label={t("title")}
            className="contents">
            {sortedCompanions.map((npc) => (
              <li
                key={npc._id}
                className={cn(COMPANIONS_SLOTS.companion, "min-h-0")}>
                <CompanionNpcCard
                  npc={npc}
                  unnamedFallback={unnamed}
                  isEditing={showLiaisonActions}
                  isPersisting={isLinking}
                  sessionCode={sessionCodeForLookup}
                  onUnlink={(companion) => void persistNpcLink(companion, null)}
                />
              </li>
            ))}
          </ul>
        </>
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
                      disabled={isLinking}
                      onClick={() => void persistNpcLink(npc, playerId)}
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
              variant="secondary"
              onClick={() => setLinkOpen(false)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
