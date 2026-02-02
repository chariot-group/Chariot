"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShoppingCart, SquarePen } from "lucide-react";
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
      currentPassword: z.string().min(8, t("passwordError.min")),
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
    <main className="flex flex-col items-center pt-8 h-full px-4 sm:px-6 md:px-8">
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 py-4 md:py-8">
        <div className="flex flex-col gap-2">
          <Card className="flex flex-col sm:flex-row overflow-hidden">
            <div className="relative w-full aspect-3/2">
              <Image
                fill
                className="object-cover rounded-[15px]"
                src={user?.avatar || "/default-avatar.png"}
                alt={user?.username ? `${user.username} ${t("pageTitle")}` : t("pageTitle")}
                priority
              />
            </div>
            <div className="flex flex-col justify-between gap-2 p-4 sm:w-1/2">
              <div>
                <h2 className="text-4xl font-bold">{user?.username}</h2>
                <p className="text-xl font-semibold">{`${user?.firstName} ${user?.lastName}`}</p>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </Card>
          <Card className="gap-10">
            <h2 className="text-xl font-bold">{t("changePassword")}</h2>
            <div className="px-2">
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
              <Field className="pl-10 w-1/2">
                <Button
                  type="submit"
                  form="form-reset-password"
                  className="relative"
                  aria-label={t("updatePassword")}>
                  <SquarePen
                    className="absolute left-3"
                    aria-hidden="true"
                  />
                  {t("updatePassword")}
                </Button>
              </Field>
            </div>
          </Card>
        </div>
        <Card className="flex flex-col h-145">
          <div className="flex flex-row justify-between items-center shrink-0">
            <h2 className="text-xl font-bold">{t("sessionHistory")}</h2>
            <Card
              className="bg-gray-middle-light px-3 py-2 rounded-[15px] flex flex-row items-center gap-6 justify-between"
              role="status"
              aria-live="polite">
              <span className="font-bold hidden xl:block">{t("yourTokens")}</span>
              <span className="flex flex-row gap-1 font-semibold">
                {user?.balance ?? 0}
                <Image
                  src={Token}
                  alt=""
                  aria-hidden="true"
                />
              </span>
            </Card>
          </div>
          {/* historique des sessions */}
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
                        className="bg-gray-middle-light px-3 py-2 rounded-[15px] flex flex-row items-center gap-6 justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-20 flex-1">
                          <span className="text-sm">
                            <time dateTime={entry.date.toString()}>{formattedDate}</time>
                          </span>
                          <span className="text-sm">{entry.campaignName}</span>
                        </div>
                        <span
                          className={"text-sm font-bold"}
                          aria-label={`${entry.value > 0 ? "+" : ""}${entry.value} tokens`}>
                          {entry.value} to
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
              className="pl-10 w-1/2"
              aria-label={t("reloadTokens")}>
              <Button className="relative rounded-[15px] w-full px-5">
                <ShoppingCart
                  className="absolute left-3"
                  aria-hidden="true"
                />{" "}
                {t("reloadTokens")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
