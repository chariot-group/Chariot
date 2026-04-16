"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import sessionService, { SessionParticipant } from "@/services/SessionService";
import { useAppSelector } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import Token from "@public/assets/token.svg";
import { Copy } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SessionPage() {
  const t = useTranslations("sessionPage");
  const { idCampaign, code } = useParams<{ idCampaign: string; code: string }>();
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const toast = useToast();
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await sessionService.getSession(code);
      } catch {
        toast.info(t("toast.sessionNotFound"));
        router.back();
        return;
      }

      try {
        const data = await sessionService.getParticipants(code);
        setParticipants(data.participants);
        toast.success(t("toast.connectionSuccess"));
      } catch {
        toast.error(t("toast.participantsError"));
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await sessionService.leaveSession(code);
      toast.info(t("toast.leaveSuccess"));
      router.push(`/${locale}/welcome`);
    } catch {
      toast.error(t("toast.leaveError"));
      setIsLeaving(false);
    }
  };

  const copy = (text: string): void => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success(t("toast.copySuccess"));
        })
        .catch(() => {
          toast.error(t("toast.copyError"));
        });
    } else {
      toast.error(t("toast.copyNotSupported"));
    }
  };

  return (
    <main
      className="flex flex-col min-h-dvh"
      aria-label={t("mainAriaLabel", { label: campaign?.label ?? t("campaignFallback") })}>
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Players section */}
        <section
          aria-labelledby="players-heading"
          className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4 sm:p-6">
            <h1
              id="players-heading"
              className="text-xl sm:text-2xl font-bold">
              {t("title")}
              <span className="font-normal"> - {campaign?.label}</span>
            </h1>

            <div
              role="list"
              aria-label={t("players.ariaLabel")}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-[50vh] overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              tabIndex={0}>
              {participants.length > 0 &&
                participants.map((participant, index) => (
                  <Card
                    key={participant.id}
                    role="listitem"
                    className="border bg-gray border-none gap-0 p-3">
                    <span className="text-sm font-bold">{participant.characterId}</span>
                    <span className="text-sm text-muted-foreground">{t("players.player", { index: index + 1 })}</span>
                  </Card>
                ))}
              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center">{t("players.noPlayers")}</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={isLeaving}>
                {t("players.leaveButton")}
              </Button>
              <Button aria-label={t("players.addTokenAriaLabel", { count: participants.length + 1 })}>
                <span className="flex items-center gap-1.5">
                  {t("players.addTokenButton", { count: participants.length + 1 })}
                  <Image
                    src={Token}
                    alt=""
                    aria-hidden="true"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </span>
              </Button>
            </div>
          </Card>
        </section>

        {/* Session code section */}
        <aside
          aria-labelledby="session-code-heading"
          className="lg:col-span-1">
          <Card className="flex flex-col gap-0 p-4 sm:p-6">
            <h2
              id="session-code-heading"
              className="text-base sm:text-lg font-bold mb-4">
              {t("sessionCode.heading")}
            </h2>
            <p
              className="w-full text-xl text-center"
              aria-label={t("sessionCode.ariaLabel", { code })}>
              {code}
            </p>
            <div className="gap-3 items-center">
              <Button
                variant="outline"
                className="mt-4 w-full"
                aria-label={t("sessionCode.copyAriaLabel")}
                onClick={() => copy(code)}>
                <Copy /> {t("sessionCode.copyButton")}
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
