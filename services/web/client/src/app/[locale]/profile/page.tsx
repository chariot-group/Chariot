"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { usePasswordForm } from "@/hooks/usePasswordForm";
import { ArrowLeft, Check, Copy, DotIcon, Eye, EyeOff, Link, Loader2, ShoppingCart, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import Token from "@public/assets/token.svg";
import { usePathname, useRouter } from "next/navigation";
import { useProfileForm } from "@/hooks/useProfileForm";
import ReadProfile from "@/components/profile/ReadProfile";
import UpdateProfile from "@/components/profile/UpdateProfile";
import { isEnterWithModifiers, isEnterWithoutModifiers } from "@/utils/keyboard.utils";
import ShopDialog from "@/components/dialogs/Shop";
import referralService, { type ReferralInfo } from "@/services/ReferralService";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { REFERRAL_TIERS } from "@/lib/referral";

export default function ProfilePage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { user, loading, refreshUser } = useUser({ autoFetch: true });
  const hasRefreshedOnOpenRef = useRef(false);
  const [viewNewPassword, setViewNewPassword] = useState<boolean>(false);
  const [viewConfirmNewPassword, setViewConfirmNewPassword] = useState<boolean>(false);
  const t = useTranslations("ProfilePage");
  const router = useRouter();

  const tEdit = useTranslations("ProfilePage.editProfile");
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
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [codeCopyState, setCodeCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "loading" | "success">("idle");

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
      <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-2 gap-2 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-2">
          {!isUpdating && <ReadProfile user={user} />}
          {isUpdating && (
            <UpdateProfile
              user={user}
              form={formProfile}
              isLoading={isLoadingProfile}
              onSubmit={onUpdate}
              onCancel={onCancel}
            />
          )}
          <Card
            className="gap-6 sm:gap-8 md:gap-10"
            role="region"
            aria-labelledby="change-password-heading">
            <h2
              id="change-password-heading"
              className="text-lg sm:text-xl font-bold">
              {t("changePasswordTitle")}
            </h2>
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
        </div>
        <Card
          className="flex flex-col h-100 sm:h-125 lg:h-145"
          role="region"
          aria-labelledby="session-history-heading">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center shrink-0">
            <h2
              id="session-history-heading"
              className="text-lg sm:text-xl font-bold">
              {t("sessionHistory")}
            </h2>
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
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              role="list"
              aria-label={t("sessionHistory")}
              tabIndex={0}
              style={{
                maskImage: "linear-gradient(to top, transparent 0, black 30%)",
                WebkitMaskImage: "linear-gradient(to top, transparent 0, black 30%)",
              }}>
              {user?.history && user.history.length > 0 ? (
                <div className="space-y-2">
                  {user.history.map((entry, index) => {
                    const entryDate = new Date(entry.date);
                    const formattedDate = entryDate.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    return (
                      <Card
                        key={index}
                        role="listitem"
                        aria-label={
                          entry.value > 0
                            ? t("sessionItemEarned", {
                                date: formattedDate,
                                campaign: entry.campaignName,
                                amount: Math.abs(entry.value),
                              })
                            : t("sessionItemSpent", {
                                date: formattedDate,
                                campaign: entry.campaignName,
                                amount: Math.abs(entry.value),
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
                            {entry.campaignName}
                          </span>
                        </div>
                        <span
                          className={
                            "text-sm sm:text-base font-bold shrink-0 self-end sm:self-auto flex flex-row items-center gap-1"
                          }
                          aria-hidden="true">
                          {entry.value}
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
                  <p>{t("noHistory")}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
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

            <ShopDialog
              open={showShopDialog}
              onOpenChange={setShowShopDialog}
            />
          </div>
        </Card>
      </div>
      {referralInfo && (
        <div className="w-full max-w-7xl mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
            <Card
              className="flex flex-col gap-4 lg:col-span-2"
              role="region"
              aria-labelledby="referral-tiers-heading">
              <div>
                <h2
                  id="referral-tiers-heading"
                  className="text-lg sm:text-xl font-bold">
                  {t("referral.tiersTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("referral.tiersSubtitle")}</p>
              </div>

              <div
                className="flex flex-col items-center gap-1.5 w-full"
                role="list"
                aria-label={t("referral.tiersTitle")}>
                {REFERRAL_TIERS.map((tier, idx) => {
                  const widthPercent = 30 + Math.round((idx / (REFERRAL_TIERS.length - 1)) * 70);
                  const isReached = referralInfo.pendingReferralsCount >= tier.minReferees;
                  const isCurrentTier =
                    isReached &&
                    (idx === 0 || referralInfo.pendingReferralsCount < REFERRAL_TIERS[idx - 1].minReferees);
                  return (
                    <div
                      key={tier.minReferees}
                      role="listitem"
                      style={{ width: `${widthPercent}%` }}
                      className={cn(
                        "flex justify-between items-center px-3 py-2 rounded-[10px] transition-all duration-300",
                        isCurrentTier
                          ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                          : isReached
                            ? "bg-primary/40 text-foreground"
                            : "bg-gray-middle-light text-muted-foreground opacity-70",
                      )}>
                      <span className="text-xs font-medium">
                        {tier.minReferees}+{" "}
                        {tier.minReferees === 1 ? t("referral.tierReferral") : t("referral.tierReferrals")}
                      </span>
                      <span className="text-sm font-bold">{tier.discount}%</span>
                    </div>
                  );
                })}
              </div>

              <span className="flex flex-row items-center gap-2 mt-auto justify-center flex-wrap">
                <p className="text-xs text-green-400">
                  {t("referral.validatedReferees", { count: referralInfo.pendingReferralsCount ?? 0 })}
                </p>
                <DotIcon className="text-muted-foreground" />
                <p className="text-xs text-amber-400">
                  {t("referral.pendingFirstPurchase", {
                    count: (referralInfo.refereeCount ?? 0) - (referralInfo.validatedRefereeCount ?? 0),
                  })}
                </p>
              </span>
            </Card>

            <Card className="flex flex-col gap-0 p-4 sm:p-6">
              <h2
                id="referral-code-heading"
                className="text-base sm:text-lg font-bold mb-4">
                {t("referral.yourCode")}
              </h2>
              <p className="w-full text-xl text-center">{referralInfo.code}</p>
              <div className="gap-3 items-center grid grid-cols-5">
                <Button
                  variant="outline"
                  className={`mt-4 w-full transition-colors col-span-4 ${
                    codeCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                  }`}
                  aria-label={t("referral.copyAriaLabel")}
                  disabled={codeCopyState !== "idle"}
                  onClick={() => copy(referralInfo.code, setCodeCopyState)}>
                  {codeCopyState === "loading" && <Loader2 className="animate-spin" />}
                  {codeCopyState === "success" && <Check />}
                  {codeCopyState === "idle" && <Copy />}
                  {codeCopyState === "success" ? t("referral.codeCopied") : t("referral.copyCode")}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={t("referral.copyLinkAriaLabel")}
                      className={`mt-4 transition-colors ${
                        linkCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                      }`}
                      disabled={linkCopyState !== "idle"}
                      onClick={() => copy(`${window.location.origin}?ref=${referralInfo.code}`, setLinkCopyState)}>
                      {linkCopyState === "success" ? <Check /> : <Link />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {linkCopyState === "success" ? t("referral.linkCopied") : t("referral.copyLink")}
                  </TooltipContent>
                </Tooltip>
              </div>
            </Card>
          </div>
        </div>
      )}
      <div className="w-full max-w-7xl flex flex-row-reverse py-2 sm:py-4 md:py-6 lg:py-8">
        {isUpdating ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoadingProfile}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCancel();
                }
              }}
              aria-label={tEdit("cancelUpdate")}>
              {tEdit("cancelUpdate")}
            </Button>
            <Button
              type="submit"
              form="form-update-profile"
              disabled={isLoadingProfile || !formProfile.formState.isValid}
              tabIndex={0}
              aria-label={tEdit("updateProfile")}
              aria-busy={isLoadingProfile}>
              {isLoadingProfile ? tAuth("loading") : tEdit("updateProfile")}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setIsUpdating(true)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (isEnterWithoutModifiers(e) || e.key === " ") {
                e.preventDefault();
                setIsUpdating(true);
              }
            }}>
            <SquarePen aria-hidden="true" /> {isLoadingProfile ? tAuth("loading") : tEdit("updateProfile")}
          </Button>
        )}
      </div>
    </main>
  );
}
