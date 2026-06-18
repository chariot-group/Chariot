"use client";

import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  type MeasurementUnit,
  convertRangeString,
  displayDistanceFt,
  feetToMeters,
  isMetric,
  metersToFeet,
} from "@/utils/unit.utils";

export function useDistanceUnit() {
  const unit = useAppSelector(
    (state) => (state.user.user?.preferredMeasurementUnit ?? "metric") as MeasurementUnit,
  );
  const t = useTranslations("characterDetail.battle");

  const unitLabel = isMetric(unit) ? "m" : t("feetAbbr");
  const unitLabelFull = isMetric(unit) ? "mètres" : t("feet");

  return useMemo(
    () => ({
      unit,
      unitLabel,
      unitLabelFull,
      /** Display a value stored in feet. Returns the number in the user's unit. */
      displayFt: (ft: number) => displayDistanceFt(ft, unit),
      /** Convert a user-input value (in their preferred unit) back to feet for storage. */
      toFeet: (value: number) => (isMetric(unit) ? metersToFeet(value) : value),
      /** Convert feet to the user's preferred unit. */
      feetToDisplay: (ft: number) => (isMetric(unit) ? feetToMeters(ft) : ft),
      /** Convert a free-text range string to the user's preferred unit. */
      convertRange: (range: string) => convertRangeString(range, unit),
      isMetric: isMetric(unit),
    }),
    [unit, unitLabel, unitLabelFull],
  );
}
