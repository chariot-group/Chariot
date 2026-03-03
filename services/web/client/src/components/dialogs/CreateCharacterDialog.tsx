"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";

interface CreateCharacterDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
  /** Campaign ID for the URL */
  campaignId: string;
  /** Group ID for the URL */
  groupId: string;
}

/**
 * Dialog for choosing character type (Player or NPC) before creation
 */
export function CreateCharacterDialog({ children, campaignId, groupId }: CreateCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelectType = (type: "players" | "npcs") => {
    setOpen(false);
    router.push(`/campaigns/${campaignId}/groups/${groupId}/characters/new/${type}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("createCharacterDialogTitle")}</DialogTitle>
          <DialogDescription>{t("createCharacterDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Player Character Option */}
          <Button
            variant="outline"
            onClick={() => handleSelectType("players")}
            className="flex flex-col items-center justify-center h-32 gap-3 rounded-[15px] hover:bg-blue hover:text-black hover:border-blue transition-all duration-200"
          >
            <User className="w-10 h-10" aria-hidden="true" />
            <span className="text-sm font-medium">{t("playerCharacter")}</span>
          </Button>

          {/* NPC Option */}
          <Button
            variant="outline"
            onClick={() => handleSelectType("npcs")}
            className="flex flex-col items-center justify-center h-32 gap-3 rounded-[15px] hover:bg-red hover:text-white hover:border-red transition-all duration-200"
          >
            <Users className="w-10 h-10" aria-hidden="true" />
            <span className="text-sm font-medium">{t("npcCharacter")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
