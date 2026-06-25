"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import {
  computeReferrerDiscount,
  REFERRAL_TIERS,
  REFERRER_MAX_DISCOUNT_PERCENT,
} from "@/lib/referral";
import type { ReferralInfo } from "@/services/ReferralService";
import { Check, CircleHelp, Link, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const TIERS_ASCENDING = [...REFERRAL_TIERS].reverse();
const BAR_HEIGHT = "h-9 sm:h-10";

type CopyState = "idle" | "loading" | "success";

interface ProfileReferralSectionProps {
  referralInfo: ReferralInfo;
  linkCopyState: CopyState;
  onCopyLink: () => void;
}

export default function ProfileReferralSection({
  referralInfo,
  linkCopyState,
  onCopyLink,
}: ProfileReferralSectionProps) {
  const t = useTranslations("ProfilePage.referral");

  const validatedCount = referralInfo.pendingReferralsCount ?? 0;
  const pendingCount =
    (referralInfo.refereeCount ?? 0) - (referralInfo.validatedRefereeCount ?? 0);
  const currentDiscount = computeReferrerDiscount(validatedCount);
  const nextTier = TIERS_ASCENDING.find((tier) => tier.minReferees > validatedCount);

  return (
    <Card
      className="flex flex-col gap-3 p-4 sm:p-5"
      role="region"
      aria-labelledby="referral-tiers-heading">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              id="referral-tiers-heading"
              className="text-base sm:text-lg font-bold">
              {t("tiersTitle")}
            </h3>
            <InfoTooltip
              content={
                <div className="flex flex-col gap-1.5 text-xs">
                  <p className="font-semibold">{t("rulesTooltipTitle")}</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>{t("rulesTooltipReferee")}</li>
                    <li>{t("rulesTooltipReferrer")}</li>
                    <li>{t("rulesTooltipValidation")}</li>
                    <li>{t("rulesTooltipReset")}</li>
                    <li>{t("rulesTooltipNotCumulative")}</li>
                  </ul>
                </div>
              }
              side="bottom"
              align="start"
              moreInfoLabel={t("rulesTooltipAriaLabel")}>
              <CircleHelp
                className="size-4 text-muted-foreground cursor-help shrink-0 [@media(hover:none)]:hidden"
                aria-hidden="true"
              />
            </InfoTooltip>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("tiersSubtitle")}</p>
        </div>

        <div
          className="flex flex-col gap-1.5 shrink-0 lg:items-end"
          aria-labelledby="referral-code-heading">
          <h4
            id="referral-code-heading"
            className="text-sm font-semibold text-muted-foreground">
            {t("yourCode")}
          </h4>
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <p className="text-lg font-bold tracking-wide">{referralInfo.code}</p>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("copyLinkAriaLabel")}
              className={cn(
                "transition-colors whitespace-nowrap",
                linkCopyState === "success" && "bg-green-500 hover:bg-green-500 border-green-500 text-white",
              )}
              disabled={linkCopyState !== "idle"}
              onClick={onCopyLink}>
              {linkCopyState === "loading" && <Loader2 className="animate-spin" />}
              {linkCopyState === "success" && <Check />}
              {linkCopyState === "idle" && <Link />}
              {linkCopyState === "success" ? t("linkCopied") : t("copyLink")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
        <div
          className="min-w-0 flex-1"
          role="progressbar"
          aria-label={t("tiersProgressAriaLabel")}
          aria-valuemin={0}
          aria-valuemax={REFERRER_MAX_DISCOUNT_PERCENT}
          aria-valuenow={currentDiscount}>
          <div
            className={cn(
              BAR_HEIGHT,
              "flex w-full min-w-0 gap-0.5 overflow-hidden rounded-full",
            )}
            role="list"
            aria-label={t("tiersTitle")}>
            {TIERS_ASCENDING.map((tier) => {
              const isReached = validatedCount >= tier.minReferees;
              const isCurrentTier = isReached && tier.discount === currentDiscount;
              const tierState = isCurrentTier ? "current" : isReached ? "reached" : "upcoming";

              return (
                <div
                  key={tier.minReferees}
                  role="listitem"
                  data-tier-state={tierState}
                  aria-label={t("tierSegmentAriaLabel", {
                    count: tier.minReferees,
                    discount: tier.discount,
                  })}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center transition-colors duration-300 first:rounded-l-full last:rounded-r-full",
                    isCurrentTier
                      ? "bg-primary text-primary-foreground shadow-inner"
                      : isReached
                        ? "bg-primary/60 text-primary-foreground"
                        : "bg-gray-middle-light text-muted-foreground",
                  )}>
                  <span className="text-[8px] font-bold tabular-nums leading-none sm:text-[10px] md:text-xs">
                    {tier.discount}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="flex shrink-0 flex-row items-baseline justify-between gap-2 sm:flex-col sm:items-end sm:justify-center sm:gap-0 sm:text-right"
          aria-label={t("maxDiscountAriaLabel", { discount: REFERRER_MAX_DISCOUNT_PERCENT })}>
          <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
            {t("maxDiscountLabel")}
          </span>
          <span className="text-lg sm:text-xl font-bold tabular-nums text-foreground">
            {REFERRER_MAX_DISCOUNT_PERCENT}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-green-400">
            {t("validatedReferees", { count: validatedCount })}
          </span>
          <span
            className="text-muted-foreground hidden sm:inline"
            aria-hidden="true">
            •
          </span>
          <span className="text-amber-400">{t("pendingFirstPurchase", { count: pendingCount })}</span>
        </div>
        {nextTier && currentDiscount < REFERRER_MAX_DISCOUNT_PERCENT ? (
          <p className="text-muted-foreground">
            {t("nextTierGoal", {
              count: nextTier.minReferees - validatedCount,
              discount: nextTier.discount,
            })}
          </p>
        ) : validatedCount >= TIERS_ASCENDING[TIERS_ASCENDING.length - 1].minReferees ? (
          <p className="font-medium text-foreground">
            {t("maxTierReached", { discount: REFERRER_MAX_DISCOUNT_PERCENT })}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
