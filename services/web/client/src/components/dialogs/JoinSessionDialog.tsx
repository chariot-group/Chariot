"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { CharacterSelect } from "@/components/character/CharacterSelect";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import sessionService from "@/services/SessionService";
import characterService from "@/services/CharacterService";
import { Character } from "@/types/character";
import { useAppDispatch } from "@/store/hooks";
import { setCurrentSession } from "@/store/slices/sessionSlice";
import { usePathname, useRouter } from "next/navigation";

interface JoinSessionDialogProps {
  /** The element that opens the dialog (e.g. a Button). */
  children: React.ReactNode;
}

export function JoinSessionDialog({ children }: JoinSessionDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingCharacters(true);
    characterService
      .getPlayersWithoutGroup(1, 100)
      .then((res) => setCharacters(res.data))
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, [open]);

  const handleJoin = async () => {
    if (code.length < 6 || !characterId) return;

    setIsJoining(true);
    setError(null);

    try {
      const session = await sessionService.getSession(code);

      if (session.status === "closed") {
        setError(t("joinSessionErrorClosed"));
        return;
      }

      await sessionService.joinSession(code, characterId);

      dispatch(setCurrentSession({ code, campaignId: session.creatorCampaignId }));

      const locale = pathname?.split("/")[1] || "fr";
      router.push(`/${locale}/campaigns/${session.creatorCampaignId}/session/${code}`);

      setOpen(false);
      setCode("");
    } catch {
      setError(t("joinSessionErrorNotFound"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setCode("");
      setCharacterId("");
      setError(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("joinSessionDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4 w-full overflow-hidden">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(val) => {
              setCode(val);
              setError(null);
            }}
            disabled={isJoining}
            autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <CharacterSelect
            characters={characters}
            value={characterId}
            onValueChange={setCharacterId}
            placeholder={t("joinSessionSelectCharacterPlaceholder")}
            disabled={isJoining || loadingCharacters}
            triggerClassName="w-full text-xs"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isJoining}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={handleJoin}
            disabled={isJoining || code.length < 6 || !characterId}>
            {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("joinSession")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
