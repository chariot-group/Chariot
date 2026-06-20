"use client";

import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  type MeasurementUnit,
  convertRangeString,
  convertRangeStringBoth,
  displayDistanceFt,
  displayHeightFt,
  displayWeightLbs,
  feetToMeters,
  feetToCm,
  lbsToKg,
  cmToFeet,
  kgToLbs,
  metersToFeet,
  isMetric,
  HEIGHT_UNIT_LABEL,
  WEIGHT_UNIT_LABEL,
} from "@/utils/unit.utils";

export function useDistanceUnit() {
  const unit = useAppSelector(
    (state) => (state.user.user?.preferredMeasurementUnit ?? "metric") as MeasurementUnit,
  );
  const showBoth = useAppSelector((state) => state.user.user?.showBothUnits ?? false);
  const t = useTranslations("characterDetail.battle");

  const unitLabel = isMetric(unit) ? "m" : t("feetAbbr");
  const secondaryUnitLabel = showBoth ? (isMetric(unit) ? t("feetAbbr") : "m") : null;

  return useMemo(
    () => ({
      unit,
      showBoth,
      unitLabel,
      secondaryUnitLabel,
      /** Primary display value (number) — feet value converted to user's unit. */
      displayFt: (ft: number) => displayDistanceFt(ft, unit),
      /** Secondary feet value for "show both" mode, or null. */
      secondaryFt: showBoth
        ? (ft: number) => (isMetric(unit) ? ft : feetToMeters(ft))
        : null,
      /** Convert user-input value (primary unit) back to feet for storage. */
      toFeet: (value: number) => (isMetric(unit) ? metersToFeet(value) : value),
      /** Convert a free-text range string to the user's preferred unit. */
      convertRange: (range: string) =>
        showBoth ? convertRangeStringBoth(range) : convertRangeString(range, unit),
      isMetric: isMetric(unit),

      // Height (stored in feet)
      heightLabel: HEIGHT_UNIT_LABEL[unit],
      secondaryHeightLabel: showBoth ? HEIGHT_UNIT_LABEL[unit === "metric" ? "imperial" : "metric"] : null,
      displayHeight: (ft: number) => displayHeightFt(ft, unit),
      secondaryHeight: showBoth ? (ft: number) => (isMetric(unit) ? ft : feetToCm(ft)) : null,
      toHeightFeet: (value: number) => (isMetric(unit) ? cmToFeet(value) : value),

      // Weight (stored in lbs)
      weightLabel: WEIGHT_UNIT_LABEL[unit],
      secondaryWeightLabel: showBoth ? WEIGHT_UNIT_LABEL[unit === "metric" ? "imperial" : "metric"] : null,
      displayWeight: (lbs: number) => displayWeightLbs(lbs, unit),
      secondaryWeight: showBoth ? (lbs: number) => (isMetric(unit) ? lbs : lbsToKg(lbs)) : null,
      toWeightLbs: (value: number) => (isMetric(unit) ? kgToLbs(value) : value),
    }),
    [unit, showBoth, unitLabel, secondaryUnitLabel],
  );
}
