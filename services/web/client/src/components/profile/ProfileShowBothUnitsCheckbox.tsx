"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
    <div className="flex items-center gap-2 sm:self-end sm:mb-[10px]">
      <Checkbox
        id="show-both-units"
        checked={current}
        onCheckedChange={(checked) => handleChange(Boolean(checked))}
        disabled={isSaving}
      />
      <Label
        htmlFor="show-both-units"
        className="text-sm font-medium cursor-pointer">
        {t("showBothUnits")}
      </Label>
      <InfoTooltip
        content={t("showBothUnitsDescription")}
        side="bottom"
        moreInfoLabel={t("showBothUnitsDescription")}>
        <Info
          className="size-3.5 text-muted-foreground cursor-help shrink-0"
          aria-hidden="true"
        />
      </InfoTooltip>
    </div>
  );
}
