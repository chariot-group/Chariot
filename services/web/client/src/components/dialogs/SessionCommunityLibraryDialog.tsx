"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodexSpellSearchDialog from "@/components/character/tabContents/magic/CodexSpellSearchDialog";
import MonsterCodexDialog from "@/components/character/MonsterCodexDialog";
import {
  createPortaledFilterOpenTracker,
  shouldPreventDialogDismissForPortaledFilter,
} from "@/lib/portaledFilterOpenTracker";

type LibraryTab = "spells" | "monsters" | "players";

const LIBRARY_TAB_TRIGGER_CLASS =
  "rounded-[12px] border border-transparent px-3 py-2.5 text-sm font-semibold text-white/65 transition-all hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 data-[state=active]:border-purple/60 data-[state=active]:bg-purple/25 data-[state=active]:text-white data-[state=active]:shadow-sm";

interface SessionCommunityLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Read-only community library browser for GMs during an active session.
 * @see FR-session-gm-codex-library
 */
export function SessionCommunityLibraryDialog({ open, onOpenChange }: SessionCommunityLibraryDialogProps) {
  const t = useTranslations("sessionCommunityLibrary");
  const [activeTab, setActiveTab] = useState<LibraryTab>("spells");
  const portaledFilterOpenTrackerRef = useRef(createPortaledFilterOpenTracker());

  useEffect(() => {
    if (open) {
      setActiveTab("spells");
      portaledFilterOpenTrackerRef.current.reset();
    }
  }, [open]);

  const shouldPreventDialogOutsideDismiss = (target: EventTarget | null) =>
    shouldPreventDialogDismissForPortaledFilter(portaledFilterOpenTrackerRef.current, target);

  const preventOutsideDismiss = (event: { preventDefault: () => void; target?: EventTarget | null; detail?: { originalEvent?: { target?: EventTarget | null } } }) => {
    const target = event.detail?.originalEvent?.target ?? event.target ?? null;
    if (shouldPreventDialogOutsideDismiss(target)) {
      event.preventDefault();
    }
  };

  const sharedPortaledFilterOpenTracker = portaledFilterOpenTrackerRef.current;

  const tabLabels: Record<LibraryTab, string> = {
    spells: t("tabSpells"),
    monsters: t("tabMonsters"),
    players: t("tabPlayers"),
  };

  const renderTabPanel = (tab: LibraryTab) => {
    if (tab === "spells") {
      return (
        <CodexSpellSearchDialog
          open={open}
          onOpenChange={onOpenChange}
          accentColor="purple"
          browseOnly
          embedded
          sharedPortaledFilterOpenTracker={sharedPortaledFilterOpenTracker}
        />
      );
    }

    return (
      <MonsterCodexDialog
        open={open}
        onOpenChange={onOpenChange}
        browseOnly
        embedded
        lockedEntityTypeFilter={tab === "monsters" ? "monsters" : "players"}
        sharedPortaledFilterOpenTracker={sharedPortaledFilterOpenTracker}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] flex-col p-0 sm:w-4/5"
        onPointerDownOutside={preventOutsideDismiss}
        onInteractOutside={preventOutsideDismiss}
        onFocusOutside={preventOutsideDismiss}>
        <DialogHeader className="shrink-0 border-b px-6 pb-3 pt-6">
          <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as LibraryTab)}
          className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 border-b px-6 pb-4 pt-2">
            <TabsList
              aria-label={t("tabsAriaLabel")}
              className="grid h-auto w-full grid-cols-3 gap-1 rounded-[15px] border border-white/10 bg-gray-middle-light/80 p-1">
              {(Object.keys(tabLabels) as LibraryTab[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={LIBRARY_TAB_TRIGGER_CLASS}>
                  {tabLabels[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {(Object.keys(tabLabels) as LibraryTab[]).map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              forceMount
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
              {renderTabPanel(tab)}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
