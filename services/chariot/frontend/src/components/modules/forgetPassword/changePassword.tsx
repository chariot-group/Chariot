"use client";

import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import AuthService from "@/services/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ChangePasswordProps {
  otp: string;
  userId: string;
  setStep: (step: 1 | 2 | 3) => void;
  cancel: () => void;
}
export default function ChangePassword({ otp, userId, setStep, cancel }: ChangePasswordProps) {
  const t = useTranslations("changePassword");
  const otpInlt = useTranslations("confirmOTP");
  const { success, error } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [typePassword, setTypePassword] = useState<"password" | "string">("password");
  const [typeConfirmPassword, setTypeConfirmPassword] = useState<"password" | "string">("password");

  const changePasswordSchema = z.object({
    password: z.string().min(1, t("toasts.passwordRequired")),
    confirmPassword: z.string().min(1, t("toasts.confirmPasswordRequired")),
  });

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const changePassword = useCallback(async (values: z.infer<typeof changePasswordSchema>) => {
    try {
      if (values.password !== values.confirmPassword) {
        error(t("toasts.passwordsNotMatching"));
        form.setError("confirmPassword", {
          message: t("toasts.passwordsNotMatching"),
        });
        return;
      }
      setLoading(true);
      let response = await AuthService.changePassword(userId, otp, values.password, values.confirmPassword);
      if (response.statusCode && response.statusCode === 401) {
        error(otpInlt("toasts.invalidOTP"));
        setStep(2);
        setLoading(false);
        return;
      }
      if (response.statusCode && response.statusCode === 400) {
        error(t("toasts.passwordsNotMatching"));
        form.setError("confirmPassword", {
          message: t("toasts.passwordsNotMatching"),
        });
        setLoading(false);
        return;
      }
      if (response.statusCode && response.statusCode !== 200) {
        error(t("toasts.internal"));
        setLoading(false);
        return;
      }
      success(t("toasts.passwordChanged"));
      setLoading(false);
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      error(t("toasts.internal"));
    }
  }, []);

  return (
    <div className="p-6 w-full flex flex-col items-center justify-center gap-[4dvh]">
      <div className="w-full flex flex-col items-center justify-center gap-[1dvh]">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="text-sm w-[70%] text-center">{t("description")}</p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(changePassword)}
          className="w-full flex flex-col gap-[5dvh] items-center justify-center">
          <div className="w-[50%] flex flex-col gap-[2dvh]">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between relative">
                      <Input
                        placeholder={t("placeholderPassword")}
                        {...field}
                        type={typePassword}
                        className="bg-background"
                      />
                      {
                        typePassword === "password" ? (
                          <EyeOffIcon
                            className="absolute right-2 cursor-pointer"
                            onClick={() => setTypePassword("string")}
                            size={20}
                          />
                        ) : (
                          <EyeIcon
                            className="absolute right-2 cursor-pointer"
                            onClick={() => setTypePassword("password")}
                            size={20}
                          />
                        )
                      }
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between relative">
                      <Input
                        placeholder={t("placeholderConfirmPassword")}
                        {...field}
                        type={typeConfirmPassword}
                        className="bg-background"
                      />
                      {
                        typeConfirmPassword === "password" ? (
                          <EyeOffIcon
                            className="absolute right-2 cursor-pointer"
                            onClick={() => setTypeConfirmPassword("string")}
                            size={20}
                          />
                        ) : (
                          <EyeIcon
                            className="absolute right-2 cursor-pointer"
                            onClick={() => setTypeConfirmPassword("password")}
                            size={20}
                          />
                        )
                      }
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-[50%] flex flex-row gap-[2dvh] items-center justify-center">
            <Link href={"login"}>
              <Button type="button" onClick={cancel} variant={"outline"}>
                {t("cancel")}
              </Button>
            </Link>
            {!loading && <Button type="submit">{t("send")}</Button>}
            {loading && (
              <Button className="w-[20%]">
                <Loading />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
