"use client";

import { Button, copySuccessButtonClassName } from "@/components/ui/button";
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
// Leading 0 % step: a parrain with no validated filleul already sits on the progress bar
const BAR_STEPS = [{ minReferees: 0, discount: 0 }, ...TIERS_ASCENDING];
const BAR_HEIGHT = "h-10";

const toMaxPercent = (discount: number) => `${Math.min(100, (discount / REFERRER_MAX_DISCOUNT_PERCENT) * 100)}%`;

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
  const totalCount = validatedCount + pendingCount;
  const currentDiscount = computeReferrerDiscount(validatedCount);
  const pendingDiscount = computeReferrerDiscount(totalCount);
  const nextTier = TIERS_ASCENDING.find((tier) => tier.minReferees > validatedCount);

  return (
    <Card
      className="flex flex-col gap-5 lg:gap-3"
      role="region"
      aria-labelledby="referral-tiers-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1.5 lg:gap-1 min-w-0 flex-1">
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
          <p className="text-sm text-muted-foreground leading-relaxed lg:leading-normal">{t("tiersSubtitle")}</p>
        </div>

        <div
          className="flex flex-col gap-2 lg:gap-1.5 shrink-0 lg:items-end"
          aria-labelledby="referral-code-heading">
          <h4
            id="referral-code-heading"
            className="text-sm font-semibold text-muted-foreground">
            {t("yourCode")}
          </h4>
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              aria-label={t("copyLinkAriaLabel")}
              className={cn(
                "transition-colors whitespace-nowrap",
                linkCopyState === "success" && copySuccessButtonClassName,
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

      {/* Below lg: compact view — 9 segments are unreadable on narrow cards (FR-stripe-checkout, Profile Tiers Display) */}
      <div
        className="flex flex-col gap-3 lg:hidden"
        data-testid="referral-tiers-compact">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t("compactCurrentLabel")}</span>
          <span className="text-3xl font-bold tabular-nums leading-tight text-foreground">{currentDiscount}%</span>
        </div>
        <div
          className="relative h-3 w-full overflow-hidden rounded-full bg-gray-middle-light"
          role="progressbar"
          aria-label={t("tiersProgressAriaLabel")}
          aria-valuemin={0}
          aria-valuemax={REFERRER_MAX_DISCOUNT_PERCENT}
          aria-valuenow={currentDiscount}>
          {pendingDiscount > currentDiscount && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-yellow/70 transition-[width] duration-300"
              style={{ width: toMaxPercent(pendingDiscount) }}
              data-fill="pending"
            />
          )}
          <div
            className="absolute inset-y-0 left-0 min-w-3 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: toMaxPercent(currentDiscount) }}
            data-fill="current"
          />
        </div>
        {pendingDiscount > currentDiscount && (
          <p className="text-sm leading-relaxed text-amber-400">{t("compactPendingPotential", { discount: pendingDiscount })}</p>
        )}
      </div>

      <div className="hidden lg:flex lg:flex-row lg:items-center lg:gap-3 min-w-0">
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
            {BAR_STEPS.map((tier) => {
              const isReached = validatedCount >= tier.minReferees;
              const isPendingReachable = !isReached && totalCount >= tier.minReferees;
              const isCurrentTier = isReached && tier.discount === currentDiscount;
              const isPendingCurrentTier = isPendingReachable && tier.discount === pendingDiscount;
              const tierState = isCurrentTier
                ? "current"
                : isReached
                  ? "reached"
                  : isPendingCurrentTier
                    ? "pending-current"
                    : isPendingReachable
                      ? "pending"
                      : "upcoming";

              return (
                <div
                  key={tier.minReferees}
                  role="listitem"
                  data-tier-state={tierState}
                  aria-label={
                    isPendingReachable
                      ? t("tierSegmentPendingAriaLabel", {
                          count: tier.minReferees,
                          discount: tier.discount,
                        })
                      : t("tierSegmentAriaLabel", {
                          count: tier.minReferees,
                          discount: tier.discount,
                        })
                  }
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center transition-colors duration-300 first:rounded-l-full last:rounded-r-full",
                    isCurrentTier
                      ? "bg-primary text-primary-foreground shadow-inner"
                      : isReached
                        ? "bg-primary/60 text-primary-foreground"
                        : isPendingCurrentTier
                          ? "bg-yellow text-black shadow-inner"
                          : isPendingReachable
                            ? "bg-yellow/60 text-black"
                            : "bg-gray-middle-light text-muted-foreground",
                  )}>
                  <span className="text-xs font-bold tabular-nums leading-none">
                    {tier.discount}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm leading-relaxed lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-1 lg:text-xs lg:leading-normal">
        <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2 lg:gap-y-1">
          <span className="text-green-400">
            {t("validatedReferees", { count: validatedCount })}
          </span>
          <span
            className="text-muted-foreground hidden lg:inline"
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
