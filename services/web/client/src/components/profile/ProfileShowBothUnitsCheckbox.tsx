"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import UserService from "@/services/UserService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";

export default function ProfileShowBothUnitsCheckbox() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const t = useTranslations("ProfilePage");
  const [isSaving, setIsSaving] = useState(false);

  const current = useAppSelector((state) => state.user.user?.showBothUnits ?? false);

  const handleChange = useCallback(
    async (checked: boolean) => {
      setIsSaving(true);
      try {
        const updatedUser = await UserService.updateCurrentUser({ showBothUnits: checked });
        dispatch(updateUser(updatedUser));
      } catch {
        toast.error(t("editProfile.errorMessage"));
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, toast, t],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-both-units"
          checked={current}
          onCheckedChange={(checked) => handleChange(Boolean(checked))}
          disabled={isSaving}
          aria-describedby="show-both-units-desc"
        />
        <Label
          htmlFor="show-both-units"
          className="text-sm font-medium cursor-pointer">
          {t("showBothUnits")}
        </Label>
      </div>
      <p
        id="show-both-units-desc"
        className="text-xs text-muted-foreground pl-6">
        {t("showBothUnitsDescription")}
      </p>
    </div>
  );
}
