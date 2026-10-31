"use client";

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
import { selectIsInSession, selectSessionCode, selectSessionCompanionNpcs } from "@/store/slices/sessionSlice";
import { normalizeCharacterId } from "@/lib/normalizeCharacterId";
import { companionsOfPlayer } from "@/lib/sessionPlayerCompanions";
import { CompanionNpcCard } from "@/components/character/tabContents/companions/CompanionNpcCard";
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
  const isInSession = useAppSelector(selectIsInSession);
  const reduxSessionCode = useAppSelector(selectSessionCode);
  const sessionCompanionNpcs = useAppSelector(selectSessionCompanionNpcs);
  const playerId = normalizeCharacterId(player._id) ?? player._id;
  const sessionCodeForLookup =
    sessionCodeFromUrl ?? (isInSession ? reduxSessionCode?.trim() || null : null);
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
        const updated = await persistSidebarNpcLinkedPlayer(npc, linkedPlayerId, (id, payload) =>
          CharacterService.updateCharacter("npcs", id, payload) as Promise<NPC>,
        );
        dispatch(upsertPlayerSpaceNpc(updated));
        setCompanions((current) => applyCompanionLinkChange(current, updated, playerId));
        showToast(
          linkedPlayerId ? tSidebar("linkNpcSuccess") : tSidebar("unlinkNpcSuccess"),
          "success",
        );
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
      {showLiaisonActions ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void openLinkDialog()}
            disabled={isLinking}
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
              disabled={isLinking}
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
        <div
          className="flex max-w-2xl flex-col gap-3 rounded-[15px] border border-white/10 bg-card/40 px-4 py-4"
          role="status"
          aria-labelledby="companions-empty-title">
          <h3
            id="companions-empty-title"
            className="text-sm font-semibold text-white">
            {t("emptyTitle")}
          </h3>
          <p className="text-sm text-white/70">{t("emptyDescription")}</p>
          <div>
            <p className="text-sm font-medium text-white/85">{t("emptyExamplesTitle")}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/70">
              <li>{t("emptyExampleFamiliar")}</li>
              <li>{t("emptyExampleSecondaryNpc")}</li>
            </ul>
          </div>
          {showLiaisonActions ? (
            <p className="text-sm text-white/70">{t("emptyActionHint")}</p>
          ) : null}
        </div>
      ) : (
        <ul className="grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {sortedCompanions.map((npc) => (
            <li
              key={npc._id}
              className="min-w-0 h-full">
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
