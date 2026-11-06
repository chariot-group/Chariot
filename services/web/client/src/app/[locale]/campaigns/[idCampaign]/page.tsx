"use client";
import { useTranslations } from "use-intl/react";
import { useRouter } from "next/navigation";
import { LayersPlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import FallbackLayout from "@/components/layout/Welcome/FallbackLayout";
import { useGroups } from "@/hooks/useGroups";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCampaign } from "@/store/slices/campaignSlice";
import Campaign from "@public/welcome/campaign.webp";

/** Campaign fallback: shown when no group of the campaign holds a character (FR-welcome-onboarding-fallbacks). */
export default function CampaignFallbackPage() {
  const t = useTranslations("campaignFallback");
  const router = useRouter();
  const campaign = useAppSelector(selectSelectedCampaign);
  const { activeGroups, createGroup, refreshGroups } = useGroups();
  const firstGroup = activeGroups[0];

  return (
    <FallbackLayout
      image={Campaign}
      eyebrow={campaign?.label}
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <CreateGroupDialog
            onCreateGroup={createGroup}
            onRefreshGroups={refreshGroups}>
            <Button
              type="button"
              className="min-h-10 justify-center sm:min-h-11">
              <LayersPlus aria-hidden="true" />
              {t("createGroup")}
            </Button>
          </CreateGroupDialog>
          {firstGroup && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(`/campaigns/${firstGroup.campaignId ?? campaign?._id}/groups/${firstGroup._id}/characters/new/players`)
              }
              className="min-h-10 justify-center sm:min-h-11">
              <UserPlus aria-hidden="true" />
              {t("createCharacter")}
            </Button>
          )}
        </>
      }
    />
  );
}
