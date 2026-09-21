"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Link2, Link2Off, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import CharacterService from "@/services/CharacterService";
import { characterDisplayName } from "@/lib/duplicateName";
import { applyCompanionLinkChange, playerSpaceNpcsForLinkPicker } from "@/lib/npcPlayerLink";
import { useAppDispatch } from "@/store/hooks";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { showToast } from "@/lib/toast";
import type { NPC, Player } from "@/types/character";
import { cn } from "@/lib/utils";

interface CharacterCompanionsTabContentProps {
  player: Player;
  isEditing: boolean;
}

export default function CharacterCompanionsTabContent({
  player,
  isEditing,
}: CharacterCompanionsTabContentProps) {
  const t = useTranslations("characterDetail.companions");
  const tNpc = useTranslations("characterDetail.npc");
  const tRef = useRef(t);
  tRef.current = t;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const playerId = player._id;
  const [companions, setCompanions] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkedNpcs, setUnlinkedNpcs] = useState<NPC[]>([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);
  const [pendingUnlink, setPendingUnlink] = useState<NPC | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void CharacterService.getNpcsByLinkedPlayers([playerId])
      .then((linked) => {
        if (!cancelled) setCompanions(linked);
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

  const openLinkDialog = useCallback(async () => {
    setLinkOpen(true);
    setLoadingUnlinked(true);
    try {
      const response = await CharacterService.getUnlinkedNpcsWithoutGroup(1, 50);
      setUnlinkedNpcs(playerSpaceNpcsForLinkPicker((response.data ?? []) as NPC[]));
    } catch {
      showToast(tRef.current("loadError"), "error", { toastId: "companions-unlinked-load-error" });
      setUnlinkedNpcs([]);
    } finally {
      setLoadingUnlinked(false);
    }
  }, []);

  const applyLink = useCallback(
    async (npc: NPC, linkedPlayerId: string | null) => {
      setIsSaving(true);
      try {
        const updated = (await CharacterService.updateCharacter("npcs", npc._id, {
          linkedPlayerId,
        })) as NPC;
        dispatch(upsertPlayerSpaceNpc(updated));
        setCompanions((current) => applyCompanionLinkChange(current, updated, playerId));
        if (linkedPlayerId) {
          setUnlinkedNpcs((current) => current.filter((item) => item._id !== updated._id));
          showToast(tRef.current("linkSuccess"), "success");
        } else {
          showToast(tRef.current("unlinkSuccess"), "success");
        }
      } catch {
        showToast(tRef.current("saveError"), "error");
      } finally {
        setIsSaving(false);
        setLinkOpen(false);
        setPendingUnlink(null);
      }
    },
    [dispatch, playerId],
  );

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
          <Button
            type="button"
            onClick={() => router.push(`/characters/new/npcs?linkedPlayerId=${playerId}`)}
            aria-label={t("createLinked")}
            className={cn("cursor-pointer bg-purple text-white hover:bg-purple/80")}>
            <UserPlus
              className="size-4"
              aria-hidden="true"
            />
            {t("createLinked")}
          </Button>
        </div>
      ) : null}

      {sortedCompanions.length === 0 ? (
        <p className="text-sm text-white/70">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedCompanions.map((npc) => {
            const name = characterDisplayName(npc) || unnamed;
            const cr = npc.challenge?.challengeRating;
            return (
              <li
                key={npc._id}
                className="flex min-w-0 items-center gap-2 rounded-[15px] bg-gray-middle-light px-3 py-2">
                <Link
                  href={`/characters/${npc._id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-white focus-visible:ring-1 focus-visible:ring-white/50">
                  {name}
                  {cr != null ? (
                    <span className="ml-2 text-xs font-normal text-white/60">
                      {tNpc("challengeRatingAbbr")} {cr}
                    </span>
                  ) : null}
                </Link>
                {isEditing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => setPendingUnlink(npc)}
                    aria-label={t("unlinkAria", { name })}
                    className="cursor-pointer shrink-0 text-white/80 hover:text-white">
                    <Link2Off
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Button>
                ) : null}
              </li>
            );
          })}
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
                      disabled={isSaving}
                      onClick={() => void applyLink(npc, playerId)}
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

      <ConfirmDialog
        open={!!pendingUnlink}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPendingUnlink(null);
        }}
        title={t("unlinkTitle")}
        description={t("unlinkDescription", {
          name: characterDisplayName(pendingUnlink) || unnamed,
        })}
        confirmLabel={t("unlink")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (!pendingUnlink) return;
          void applyLink(pendingUnlink, null);
        }}
        isLoading={isSaving}
      />
    </section>
  );
}
