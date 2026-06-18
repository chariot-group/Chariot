"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ProfileLocaleSelectImmediate from "@/components/profile/ProfileLocaleSelectImmediate";
import ProfileSection from "@/components/profile/ProfileSection";
import { useTranslations } from "next-intl";
import {
  getStoredUserId,
  isReleaseNotesMuted,
  setReleaseNotesMuted,
} from "@/lib/releaseNotesSeen";

interface ProfilePreferencesSectionProps {
  onViewReleaseNotes?: () => void;
}

export default function ProfilePreferencesSection({ onViewReleaseNotes }: ProfilePreferencesSectionProps) {
  const t = useTranslations("ProfilePage");
  const [muted, setMutedState] = useState(() => isReleaseNotesMuted(getStoredUserId()));

  const handleMuteChange = (checked: boolean) => {
    setMutedState(checked);
    setReleaseNotesMuted(getStoredUserId(), checked);
  };

  return (
    <ProfileSection
      id="profile-section-preferences"
      title={t("sections.preferences")}>
      <Card
        className="flex flex-col gap-0 p-4 sm:p-5"
        role="region"
        aria-labelledby="profile-preferences-heading">
        <h3
          id="profile-preferences-heading"
          className="sr-only">
          {t("sections.preferences")}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 gap-4">
          <div className="flex-1 min-w-0">
            <ProfileLocaleSelectImmediate />
          </div>

          {onViewReleaseNotes && (
            <div className="flex flex-col gap-2.5 sm:shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium shrink-0">
                  {t("releaseNotes.label")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[13px] text-xs h-8 shrink-0"
                  onClick={onViewReleaseNotes}
                  aria-haspopup="dialog">
                  {t("releaseNotes.openButton")}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mute-release-notes"
                  checked={muted}
                  onCheckedChange={(val) => handleMuteChange(val === true)}
                  aria-label={t("releaseNotes.muteAriaLabel")}
                />
                <Label
                  htmlFor="mute-release-notes"
                  className="text-xs text-white/50 cursor-pointer select-none">
                  {t("releaseNotes.muteLabel")}
                </Label>
              </div>
            </div>
          )}
        </div>
      </Card>
    </ProfileSection>
  );
}
