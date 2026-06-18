import { Card } from "@/components/ui/card";
import ProfileLocaleSelectImmediate from "@/components/profile/ProfileLocaleSelectImmediate";
import ProfileMeasurementUnitSelectImmediate from "@/components/profile/ProfileMeasurementUnitSelectImmediate";
import ProfileShowBothUnitsCheckbox from "@/components/profile/ProfileShowBothUnitsCheckbox";
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <ProfileLocaleSelectImmediate />
          <ProfileMeasurementUnitSelectImmediate />
        </div>
        <ProfileShowBothUnitsCheckbox />
      </Card>
    </ProfileSection>
  );
}
