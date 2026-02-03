"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShoppingCart, SquarePen, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import Token from "@public/assets/token.svg";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useUser({ autoFetch: true });
  const [viewNewPassword, setViewNewPassword] = useState<boolean>(false);
  const [viewConfirmNewPassword, setViewConfirmNewPassword] = useState<boolean>(false);
  const t = useTranslations("ProfilePage");

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, t("passwordError.required")),
      newPassword: z.string().min(8, t("passwordError.min")),
      confirmNewPassword: z.string().min(8, t("passwordError.min")),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: t("passwordError.mismatch"),
      path: ["confirmNewPassword"],
    });

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  function onSubmit(data: z.infer<typeof passwordSchema>) {
    // TODO: implement password change
    console.log("Change password data:", data);
  }

  useEffect(() => {
    if (!user) {
      // redirect 404 or login
      window.location.href = "/404";
      return;
    }
  }, [user]);

  return (
    <main className="flex flex-col items-center pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-2 gap-2 py-2 sm:py-4 md:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-2">
          <Card className="flex flex-col xl:flex-row overflow-hidden">
            <div className="relative w-full xl:w-1/2 aspect-video">
              {user?.avatar === null || user?.avatar === undefined ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-middle-light rounded-[15px]">
                  <User
                    className="h-16 w-16"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <Image
                  fill
                  className="object-cover rounded-[15px] bg-gray-middle-light"
                  src={user?.avatar || "/default-avatar.png"}
                  alt={user?.username ? `${user.username} ${t("pageTitle")}` : t("pageTitle")}
                  priority
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              )}
            </div>
            <div className="flex flex-col justify-between gap-2 sm:gap-3 w-full xl:w-1/2">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold wrap-break-word">{user?.username}</h2>
                <p className="text-base sm:text-lg lg:text-xl font-semibold wrap-break-word">{`${user?.firstName} ${user?.lastName}`}</p>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground break-all">{user?.email}</p>
            </div>
          </Card>
          <Card className="gap-6 sm:gap-8 md:gap-10">
            <h2 className="text-lg sm:text-xl font-bold">{t("changePassword")}</h2>
            <div className="px-0 sm:px-2">
              <form
                id="form-reset-password"
                onSubmit={form.handleSubmit(onSubmit)}
                aria-label={t("changePassword")}>
                <FieldGroup>
                  <Controller
                    name="currentPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation={"vertical"}>
                        <Input
                          {...field}
                          id="currentPassword"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "currentPassword-error" : undefined}
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
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation={"vertical"}>
                        <div className="relative">
                          <Input
                            {...field}
                            id="newPassword"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "newPassword-error" : undefined}
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
                            aria-label={t("togglePasswordVisibility")}
                            aria-pressed={viewNewPassword}
                            tabIndex={0}
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
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
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation={"vertical"}>
                        <div className="relative">
                          <Input
                            {...field}
                            id="confirmNewPassword"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "confirmNewPassword-error" : undefined}
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
                            aria-label={t("togglePasswordVisibility")}
                            aria-pressed={viewConfirmNewPassword}
                            tabIndex={0}
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
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
                  className="w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2"
                  aria-label={t("updatePassword")}>
                  <SquarePen
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    aria-hidden="true"
                  />
                  <span>{t("updatePassword")}</span>
                </Button>
              </Field>
            </div>
          </Card>
        </div>
        <Card className="flex flex-col h-100 sm:h-125 lg:h-145">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center shrink-0">
            <h2 className="text-lg sm:text-xl font-bold">{t("sessionHistory")}</h2>
            <Card
              className="bg-gray-middle-light px-2 sm:px-3 py-1.5 sm:py-2 rounded-[15px] flex flex-row items-center gap-2 sm:gap-4 lg:gap-6 justify-between self-start sm:self-auto"
              role="status"
              aria-live="polite">
              <span className="font-bold text-xs sm:text-sm hidden xl:inline">{t("yourTokens")}</span>
              <span className="flex flex-row gap-1 font-semibold text-sm sm:text-base">
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
                        className="bg-gray-middle-light px-2 sm:px-3 py-2 sm:py-2.5 rounded-[15px] flex flex-row items-center gap-2 sm:gap-6 justify-between">
                        <div className="flex flex-row items-center gap-1 sm:gap-4 md:gap-8 xl:gap-20 flex-1 min-w-0">
                          <span className="text-xs sm:text-sm text-foreground shrink-0">
                            <time dateTime={entry.date.toString()}>{formattedDate}</time>
                          </span>
                          <span className="text-sm sm:text-base truncate">{entry.campaignName}</span>
                        </div>
                        <span
                          className={
                            "text-sm sm:text-base font-bold shrink-0 self-end sm:self-auto flex flex-row items-center gap-1"
                          }
                          aria-label={`${entry.value > 0 ? "+" : ""}${entry.value} tokens`}>
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
            <Link
              href={"#"}
              className="w-full sm:w-auto"
              aria-label={t("reloadTokens")}>
              <Button className="rounded-[15px] w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2">
                <ShoppingCart
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <span>{t("reloadTokens")}</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
