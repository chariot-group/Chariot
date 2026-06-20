"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import ProfileMeasurementUnitSelect, { type MeasurementUnit } from "@/components/profile/ProfileMeasurementUnitSelect";
import { useToast } from "@/hooks/useToast";
import UserService from "@/services/UserService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";

export default function ProfileMeasurementUnitSelectImmediate() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const t = useTranslations("ProfilePage.editProfile");
  const [isSaving, setIsSaving] = useState(false);

  const currentUnit = useAppSelector((state) => state.user.user?.preferredMeasurementUnit ?? "metric") as MeasurementUnit;

  const handleUnitChange = useCallback(
    async (newUnit: MeasurementUnit) => {
      if (newUnit === currentUnit) return;

      setIsSaving(true);
      try {
        const updatedUser = await UserService.updateCurrentUser({ preferredMeasurementUnit: newUnit });
        dispatch(updateUser(updatedUser));
      } catch {
        toast.error(t("errorMessage"));
      } finally {
        setIsSaving(false);
      }
    },
    [currentUnit, dispatch, toast, t],
  );

  return (
    <ProfileMeasurementUnitSelect
      value={currentUnit}
      onValueChange={handleUnitChange}
      disabled={isSaving}
    />
  );
}
