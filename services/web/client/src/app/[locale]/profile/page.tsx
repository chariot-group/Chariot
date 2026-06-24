"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { usePasswordForm } from "@/hooks/usePasswordForm";
import { ArrowLeft, Eye, EyeOff, ShoppingCart, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import Token from "@public/assets/token.svg";
import { usePathname, useRouter } from "next/navigation";
import { useProfileForm } from "@/hooks/useProfileForm";
import ProfileSection from "@/components/profile/ProfileSection";
import ProfileGdprActions from "@/components/profile/ProfileGdprActions";
import ProfileReferralSection from "@/components/profile/ProfileReferralSection";
import ReadProfile from "@/components/profile/ReadProfile";
import UpdateProfile from "@/components/profile/UpdateProfile";
import ProfilePreferencesSection from "@/components/profile/ProfilePreferencesSection";
import { isEnterWithModifiers } from "@/utils/keyboard.utils";
import ShopDialog from "@/components/dialogs/Shop";
import { ReleaseNotesModal } from "@/components/dialogs/ReleaseNotesModal";
import referralService, { type ReferralInfo } from "@/services/ReferralService";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  filterAndSortTokenHistory,
  formatTokenAmount,
  isShopPurchaseEntry,
  isTokenPurchase,
  type TokenHistoryFilters,
} from "@/lib/tokenHistory";
import { computeEffectiveReferralDiscount } from "@/lib/referral";
import { loadTokenHistoryFilters, saveTokenHistoryFilters } from "@/lib/tokenHistoryFilters";

export default function ProfilePage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { user, loading, refreshUser } = useUser({ autoFetch: true });
  const hasRefreshedOnOpenRef = useRef(false);
  const [viewNewPassword, setViewNewPassword] = useState<boolean>(false);
  const [viewConfirmNewPassword, setViewConfirmNewPassword] = useState<boolean>(false);
  const t = useTranslations("ProfilePage");
  const router = useRouter();

  const tAuth = useTranslations("auth");

  const {
    form: formProfile,
    isLoading: isLoadingProfile,
    isUpdating,
    setIsUpdating,
    onUpdate,
    onCancel,
  } = useProfileForm();

  const [showShopDialog, setShowShopDialog] = useState<boolean>(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState<boolean>(false);
  const [historyFilters, setHistoryFilters] = useState<TokenHistoryFilters>(() => loadTokenHistoryFilters());

  useEffect(() => {
    saveTokenHistoryFilters(historyFilters);
  }, [historyFilters]);

  const filteredHistory = useMemo(
    () => filterAndSortTokenHistory(user?.history ?? [], historyFilters),
    [historyFilters, user?.history],
  );

  const hasHistory = (user?.history?.length ?? 0) > 0;
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "loading" | "success">("idle");

  const effectiveReferralDiscount = useMemo(
    () => (referralInfo ? computeEffectiveReferralDiscount(referralInfo) : 0),
    [referralInfo],
  );

  useEffect(() => {
    referralService
      .getMyReferral()
      .then(setReferralInfo)
      .catch((error) => {
        console.error("Failed to fetch referral info", error);
      });
  }, []);

  const { form: formPassword, onSubmit, isLoading: isLoadingPassword } = usePasswordForm();
  useEffect(() => {
    // Ne pas rediriger pendant la transition utilisateur ou le chargement
    if (loading) return;

    if (!user) {
      const timer = setTimeout(() => {
        router.push(`/${locale}/welcome`);
      }, 500); // Délai de grâce pour attendre le chargement

      return () => clearTimeout(timer);
    }
  }, [user, loading, locale, router]);

  useEffect(() => {
    if (loading || !user || hasRefreshedOnOpenRef.current) return;

    hasRefreshedOnOpenRef.current = true;
    refreshUser().catch(() => {
      hasRefreshedOnOpenRef.current = false;
    });
  }, [loading, refreshUser, user]);

  const copy = (text: string, setState: Dispatch<SetStateAction<"idle" | "loading" | "success">>): void => {
    setState("loading");
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setState("success");
          setTimeout(() => setState("idle"), 1000);
        })
        .catch(() => {
          setState("idle");
        });
    } else {
      setState("idle");
    }
  };

  return (
    <main
      className="flex flex-col items-center pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
      role="main"
      aria-label={t("pageTitle")}>
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <div className="w-full justify-end flex">
        <Button
          variant={"link"}
          onClick={() => router.back()}>
          <div className="flex flex-row gap-1 items-center">
            <ArrowLeft />
            <span>{t("back")}</span>
          </div>
        </Button>
      </div>
      <div className="w-full max-w-7xl flex flex-col gap-6 sm:gap-8 pb-6 sm:pb-8 md:pb-10">
        {!isUpdating && (
          <ReadProfile
            user={user}
            onEdit={() => setIsUpdating(true)}
            isLoading={isLoadingProfile}
          />
        )}
        {isUpdating && (
          <UpdateProfile
            user={user}
            form={formProfile}
            isLoading={isLoadingProfile}
            onSubmit={onUpdate}
            onCancel={onCancel}
          />
        )}

        <ProfilePreferencesSection onViewReleaseNotes={() => setShowReleaseNotes(true)} />

        <ProfileSection
          id="profile-section-tokens"
          title={t("sections.tokens")}>
          <Card
            className="flex flex-col h-100 sm:h-125 lg:h-145"
            role="region"
            aria-labelledby="token-history-heading">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center shrink-0">
              <h3
                id="token-history-heading"
                className="text-lg sm:text-xl font-bold">
                {t("tokenHistory")}
              </h3>
              <Card
                className="bg-gray-middle-light px-2 sm:px-3 py-1.5 sm:py-2 rounded-[15px] flex flex-row items-center gap-2 sm:gap-4 lg:gap-6 justify-between self-start sm:self-auto"
                role="status"
                aria-live="polite"
                aria-label={t("tokenBalanceAria", { balance: user?.balance ?? 0 })}>
                <span
                  className="font-bold text-xs sm:text-sm hidden xl:inline"
                  aria-hidden="true">
                  {t("yourTokens")}
                </span>
                <span
                  className="flex flex-row gap-1 font-semibold text-sm sm:text-base"
                  aria-hidden="true">
                  {user?.balance ?? 0}
                  <Image
                    src={Token}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                </span>
              </Card>
            </div>
            <fieldset
              className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 border-0 p-0 m-0"
              aria-label={t("filterGroupLabel")}>
              <legend className="sr-only">{t("filterGroupLabel")}</legend>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="token-history-filter-purchases"
                  checked={historyFilters.showPurchases}
                  onCheckedChange={(checked) =>
                    setHistoryFilters((prev) => ({
                      ...prev,
                      showPurchases: checked === true,
                    }))
                  }
                  aria-labelledby="token-history-filter-purchases-label"
                />
                <Label
                  id="token-history-filter-purchases-label"
                  htmlFor="token-history-filter-purchases"
                  className="text-xs sm:text-sm font-medium cursor-pointer">
                  {t("filterPurchases")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="token-history-filter-expenses"
                  checked={historyFilters.showExpenses}
                  onCheckedChange={(checked) =>
                    setHistoryFilters((prev) => ({
                      ...prev,
                      showExpenses: checked === true,
                    }))
                  }
                  aria-labelledby="token-history-filter-expenses-label"
                />
                <Label
                  id="token-history-filter-expenses-label"
                  htmlFor="token-history-filter-expenses"
                  className="text-xs sm:text-sm font-medium cursor-pointer">
                  {t("filterExpenses")}
                </Label>
              </div>
            </fieldset>
            <div className="flex-1 overflow-hidden">
              <div
                className="h-full overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
                role="list"
                aria-label={t("tokenHistory")}
                tabIndex={0}
                style={{
                  maskImage: "linear-gradient(to top, transparent 0%, black 8%)",
                  WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 8%)",
                }}>
                {filteredHistory.length > 0 ? (
                  <div className="space-y-2 pb-3">
                    {filteredHistory.map((entry, index) => {
                      const entryDate = new Date(entry.date);
                      const dateLocale = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
                      const formattedDate = entryDate.toLocaleDateString(dateLocale, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                      const displayLabel = isShopPurchaseEntry(entry.campaignName)
                        ? t("shopPurchaseLabel")
                        : entry.campaignName;
                      const amount = Math.abs(entry.value);

                      return (
                        <Card
                          key={`${entry.date}-${entry.campaignName}-${entry.value}-${index}`}
                          role="listitem"
                          aria-label={
                            isTokenPurchase(entry.value)
                              ? t("tokenItemPurchase", {
                                  date: formattedDate,
                                  label: displayLabel,
                                  amount,
                                })
                              : t("tokenItemExpense", {
                                  date: formattedDate,
                                  label: displayLabel,
                                  amount,
                                })
                          }
                          className="bg-gray-middle-light px-2 sm:px-3 py-2 sm:py-2.5 rounded-[15px] flex flex-row items-center gap-2 sm:gap-6 justify-between">
                          <div className="flex flex-row items-center gap-1 sm:gap-4 md:gap-8 xl:gap-20 flex-1 min-w-0">
                            <span
                              className="text-xs sm:text-sm text-foreground shrink-0"
                              aria-hidden="true">
                              <time dateTime={entry.date.toString()}>{formattedDate}</time>
                            </span>
                            <span
                              className="text-sm sm:text-base truncate"
                              aria-hidden="true">
                              {displayLabel}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-sm sm:text-base font-bold shrink-0 self-end sm:self-auto flex flex-row items-center gap-1",
                              isTokenPurchase(entry.value) ? "text-green" : "text-gray-light",
                            )}
                            aria-hidden="true">
                            {formatTokenAmount(entry.value)}
                            <Image
                              src={Token}
                              alt=""
                              aria-hidden="true"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            />
                          </span>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-full text-muted-foreground"
                    role="status">
                    <p>{hasHistory ? t("noFilteredHistory") : t("noHistory")}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                className="rounded-[15px] w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2"
                onClick={() => setShowShopDialog(true)}
                aria-label={t("reloadTokens")}>
                <ShoppingCart
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <span>{t("reloadTokens")}</span>
              </Button>
              {effectiveReferralDiscount > 0 && (
                <p
                  className="text-xs font-medium text-green"
                  aria-live="polite">
                  {t("reloadDiscountHint", { discount: effectiveReferralDiscount })}
                </p>
              )}

              <ShopDialog
                open={showShopDialog}
                onOpenChange={setShowShopDialog}
              />
            </div>
          </Card>
        </ProfileSection>

        {referralInfo && (
          <ProfileSection
            id="profile-section-referral"
            title={t("sections.referral")}>
            <ProfileReferralSection
              referralInfo={referralInfo}
              linkCopyState={linkCopyState}
              onCopyLink={() => copy(`${window.location.origin}?ref=${referralInfo.code}`, setLinkCopyState)}
            />
          </ProfileSection>
        )}

        <ProfileSection
          id="profile-section-security"
          title={t("sections.security")}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-start">
            <Card
              className="gap-6 sm:gap-8 md:gap-10"
              role="region"
              aria-labelledby="change-password-heading">
              <h3
                id="change-password-heading"
                className="text-lg sm:text-xl font-bold">
                {t("changePasswordTitle")}
              </h3>
              <div className="px-0 sm:px-2">
                <form
                  id="form-reset-password"
                  onSubmit={formPassword.handleSubmit(onSubmit)}
                  onKeyDown={(event) => {
                    if (isEnterWithModifiers(event)) {
                      event.preventDefault();
                    }
                  }}
                  aria-label={t("changePasswordTitle")}>
                  <FieldGroup>
                    <Controller
                      name="currentPassword"
                      control={formPassword.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation={"vertical"}>
                          <label
                            htmlFor="currentPassword"
                            className="sr-only">
                            {t("currentPassword")}
                          </label>
                          <Input
                            {...field}
                            id="currentPassword"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "currentPassword-error" : undefined}
                            aria-required="true"
                            placeholder={t("currentPassword")}
                            autoComplete="current-password"
                            type="password"
                          />
                          {fieldState.error && (
                            <FieldError
                              id="currentPassword-error"
                              errors={[fieldState.error]}
                            />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="newPassword"
                      control={formPassword.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation={"vertical"}>
                          <label
                            htmlFor="newPassword"
                            className="sr-only">
                            {t("newPassword")}
                          </label>
                          <div className="relative">
                            <Input
                              {...field}
                              id="newPassword"
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.error ? "newPassword-error" : undefined}
                              aria-required="true"
                              placeholder={t("newPassword")}
                              autoComplete="new-password"
                              type={viewNewPassword ? "text" : "password"}
                            />
                            <button
                              type="button"
                              onClick={() => setViewNewPassword(!viewNewPassword)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setViewNewPassword(!viewNewPassword);
                                }
                              }}
                              aria-label={viewNewPassword ? t("hideNewPassword") : t("showNewPassword")}
                              aria-pressed={viewNewPassword}
                              aria-controls="newPassword"
                              tabIndex={0}
                              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground -visible:border rounded-sm">
                              {viewNewPassword ? (
                                <EyeOff
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Eye
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          </div>

                          {fieldState.error && (
                            <FieldError
                              id="newPassword-error"
                              errors={[fieldState.error]}
                            />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="confirmNewPassword"
                      control={formPassword.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation={"vertical"}>
                          <label
                            htmlFor="confirmNewPassword"
                            className="sr-only">
                            {t("confirmNewPassword")}
                          </label>
                          <div className="relative">
                            <Input
                              {...field}
                              id="confirmNewPassword"
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.error ? "confirmNewPassword-error" : undefined}
                              aria-required="true"
                              placeholder={t("confirmNewPassword")}
                              autoComplete="new-password"
                              type={viewConfirmNewPassword ? "text" : "password"}
                            />
                            <button
                              type="button"
                              onClick={() => setViewConfirmNewPassword(!viewConfirmNewPassword)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setViewConfirmNewPassword(!viewConfirmNewPassword);
                                }
                              }}
                              aria-label={viewConfirmNewPassword ? t("hideConfirmPassword") : t("showConfirmPassword")}
                              aria-pressed={viewConfirmNewPassword}
                              aria-controls="confirmNewPassword"
                              tabIndex={0}
                              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors focus-visible:border rounded-sm">
                              {viewConfirmNewPassword ? (
                                <EyeOff
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Eye
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          </div>

                          {fieldState.error && (
                            <FieldError
                              id="confirmNewPassword-error"
                              errors={[fieldState.error]}
                            />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </form>
              </div>
              <div className="flex justify-end">
                <Field className="w-full sm:w-auto">
                  <Button
                    type="submit"
                    form="form-reset-password"
                    disabled={isLoadingPassword}
                    tabIndex={0}
                    className="w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2"
                    aria-label={t("updatePassword")}
                    aria-busy={isLoadingPassword}>
                    <SquarePen
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      aria-hidden="true"
                    />
                    <span>{isLoadingPassword ? tAuth("loading") : t("updatePassword")}</span>
                  </Button>
                </Field>
              </div>
            </Card>
            <ProfileGdprActions />
          </div>
        </ProfileSection>

        <ReleaseNotesModal
          open={showReleaseNotes}
          onClose={() => setShowReleaseNotes(false)}
        />
      </div>
    </main>
  );
}
