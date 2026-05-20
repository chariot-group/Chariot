"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { usePasswordForm } from "@/hooks/usePasswordForm";
import { ArrowLeft, Coins, Eye, EyeOff, Loader2, ShoppingCart, SquarePen } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import Token from "@public/assets/token.svg";
import { usePathname, useRouter } from "next/navigation";
import { useProfileForm } from "@/hooks/useProfileForm";
import ReadProfile from "@/components/profile/ReadProfile";
import UpdateProfile from "@/components/profile/UpdateProfile";
import { isEnterWithModifiers, isEnterWithoutModifiers } from "@/utils/keyboard.utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import paymentService, { StripeProduct } from "@/services/PaymentService";
import { useToast } from "@/hooks/useToast";

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
  const [shopProducts, setShopProducts] = useState<StripeProduct[]>([]);
  const [shopLoading, setShopLoading] = useState<boolean>(false);
  const [shopError, setShopError] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const toast = useToast();
  const tShop = useTranslations("shop");

  const { form: formPassword, onSubmit, isLoading: isLoadingPassword } = usePasswordForm();

  useEffect(() => {
    if (!showShopDialog) return;
    let cancelled = false;
    setShopLoading(true);
    setShopError(false);
    paymentService
      .getProducts()
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const priceA = a.prices[0]?.unit_amount ?? 0;
          const priceB = b.prices[0]?.unit_amount ?? 0;
          return priceA - priceB;
        });
        setShopProducts(sorted);
      })
      .catch(() => {
        if (!cancelled) setShopError(true);
      })
      .finally(() => {
        if (!cancelled) setShopLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showShopDialog]);

  async function handleBuy(product: StripeProduct) {
    setCheckoutLoading(product.id);
    try {
      const checkoutUrl = await paymentService.createCheckoutSession(product.id, product.name);
      window.location.href = checkoutUrl;
    } catch {
      toast.error(tShop("checkoutError"));
      setCheckoutLoading(null);
    }
  }

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
            <span>Retour</span>
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
                            aria-label={viewNewPassword ? "Hide new password" : "Show new password"}
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
                            aria-label={
                              viewConfirmNewPassword ? "Hide password confirmation" : "Show password confirmation"
                            }
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
              aria-label={`Current token balance: ${user?.balance ?? 0} tokens`}>
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
                        aria-label={`Session on ${formattedDate} in ${entry.campaignName}, ${entry.value > 0 ? "earned" : "spent"} ${Math.abs(entry.value)} tokens`}
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

            <Dialog
              open={showShopDialog}
              onOpenChange={setShowShopDialog}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{tShop("pageTitle")}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{tShop("pageSubtitle")}</p>
                </DialogHeader>

                {shopLoading && (
                  <div
                    className="flex items-center justify-center gap-2 py-10 text-muted-foreground"
                    role="status"
                    aria-live="polite">
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>{tShop("loadingProducts")}</span>
                  </div>
                )}

                {!shopLoading && shopError && (
                  <div
                    className="flex flex-col items-center gap-3 py-10"
                    role="alert">
                    <p className="text-destructive text-sm">{tShop("errorProducts")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShopDialog(false)}>
                      {tShop("close")}
                    </Button>
                  </div>
                )}

                {!shopLoading && !shopError && shopProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">{tShop("noProducts")}</p>
                )}

                {!shopLoading && !shopError && shopProducts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopProducts.map((product) => {
                      const price = product.prices[0];
                      const tokenCount = product.metadata?.token_number
                        ? parseInt(product.metadata.token_number, 10)
                        : null;
                      const isLoading = checkoutLoading === product.id;

                      return (
                        <Card
                          key={product.id}
                          className="flex flex-col gap-3 p-4 rounded-[15px]">
                          <div className="flex items-center gap-2">
                            <Coins
                              className="h-5 w-5 text-yellow-500"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-sm">{product.name}</span>
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            {tokenCount !== null && (
                              <span className="flex items-center gap-1 text-sm font-bold">
                                {tokenCount}
                                <Image
                                  src={Token}
                                  alt=""
                                  aria-hidden="true"
                                  className="w-4 h-4"
                                />
                              </span>
                            )}
                            {price && (
                              <span className="text-sm font-semibold">
                                {((price.unit_amount ?? 0) / 100).toFixed(2)} {price.currency.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <Button
                            className="rounded-2xl w-full text-sm mt-1"
                            disabled={!!checkoutLoading}
                            onClick={() => handleBuy(product)}
                            aria-busy={isLoading}>
                            {isLoading ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              tShop("buyButton")
                            )}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
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
