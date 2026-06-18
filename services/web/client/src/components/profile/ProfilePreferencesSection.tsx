import { Card } from "@/components/ui/card";
import ProfileLocaleSelectImmediate from "@/components/profile/ProfileLocaleSelectImmediate";
import ProfileSection from "@/components/profile/ProfileSection";
import { useTranslations } from "next-intl";

export default function ProfilePreferencesSection() {
  const t = useTranslations("ProfilePage");

  return (
    <ProfileSection
      id="profile-section-preferences"
      title={t("sections.preferences")}>
      <Card
        className="flex flex-col gap-4 p-4 sm:p-5"
        role="region"
        aria-labelledby="profile-preferences-heading">
        <h3
          id="profile-preferences-heading"
          className="sr-only">
          {t("sections.preferences")}
        </h3>
        <ProfileLocaleSelectImmediate />
      </Card>
    </ProfileSection>
  );
}
