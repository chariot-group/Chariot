"use client";
import { useTranslations } from "use-intl/react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import FallbackLayout from "@/components/layout/Welcome/FallbackLayout";
import { useAppDispatch } from "@/store/hooks";
import { setContextMode } from "@/store/slices/environmentSlice";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import Character from "@public/welcome/character.webp";

/** Player space fallback: shown when the player space has no character (FR-welcome-onboarding-fallbacks). */
export default function PlayerSpaceFallbackPage() {
  const t = useTranslations("playerSpaceFallback");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleCreateCharacter = () => {
    dispatch(setContextMode("player"));
    dispatch(clearSelectedCampaign());
    router.push("/characters/new/players");
  };

  return (
    <FallbackLayout
      image={Character}
      title={t("title")}
      description={t("description")}
      hint={t("campaigns")}
      actions={
        <Button
          type="button"
          onClick={handleCreateCharacter}
          className="min-h-10 justify-center sm:min-h-11">
          <UserPlus aria-hidden="true" />
          {t("createCharacter")}
        </Button>
      }
    />
  );
}
