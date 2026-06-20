"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

export type MeasurementUnit = "metric" | "imperial";

export const MEASUREMENT_UNITS: MeasurementUnit[] = ["metric", "imperial"];

export const MEASUREMENT_UNIT_LABEL_KEYS: Record<MeasurementUnit, "measurementUnits.metric" | "measurementUnits.imperial"> = {
  metric: "measurementUnits.metric",
  imperial: "measurementUnits.imperial",
};

interface ProfileMeasurementUnitSelectProps {
  value: MeasurementUnit;
  onValueChange: (unit: MeasurementUnit) => void;
  disabled?: boolean;
}

export default function ProfileMeasurementUnitSelect({ value, onValueChange, disabled = false }: ProfileMeasurementUnitSelectProps) {
  const t = useTranslations("ProfilePage");

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <Label
        htmlFor="profile-measurement-unit-select"
        className="text-sm font-medium">
        {t("measurementUnitPreference")}
      </Label>
      <Select
        value={value}
        onValueChange={(unit) => onValueChange(unit as MeasurementUnit)}
        disabled={disabled}>
        <SelectTrigger
          id="profile-measurement-unit-select"
          className="w-full shrink-0"
          aria-label={t("measurementUnitPreferenceAria")}>
          <SelectValue>{t(MEASUREMENT_UNIT_LABEL_KEYS[value])}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
          {MEASUREMENT_UNITS.map((unit) => (
            <SelectItem
              key={unit}
              value={unit}>
              {t(MEASUREMENT_UNIT_LABEL_KEYS[unit])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
