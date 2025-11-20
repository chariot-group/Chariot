"use client";

import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import authService from "@/services/authService";
import Link from "next/link";
import { useCallback, useState } from "react";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [typePassword, setTypePassword] = useState<"password" | "string">("password");

  const { error, success } = useToast();

  const authFormSchema = z.object({
    email: z.string().email(t("errors.emailRequired")),
    password: z.string().min(1, t("errors.passwordRequired")),
  });

  const form = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const login = useCallback(async (values: z.infer<typeof authFormSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await authService.login({
        email: values.email,
        password: values.password,
      });
      if (response.statusCode && response.statusCode !== 200) {
        error(t("errors.invalidCredentials"));
        form.setError("email", {
          message: t("errors.invalidCredentials"),
        });
        form.setError("password", {
          message: t("errors.invalidCredentials"),
        });
        return;
      } else {
        const secure = location.protocol === "https:" ? "Secure;" : "";
        document.cookie = `accessToken=${response.access_token}; max-age=${24 * 60 * 60
          }; path=/; SameSite=Lax; ${secure}`;

        success(t("success.login"));
        router.push("/");
      }
    } catch (err) {
      error(t("errors.internal"));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <div className="w-full h-dvh gap-2 flex flex-col items-center justify-center bg-background">
      <Card className="w-[40%] shadow-md relative">
        <LocaleSwitcher className="absolute right-0 border-none shadow-none m-1 bg-card" />
        <div className="p-6 w-full flex flex-col items-center justify-center gap-[5dvh]">
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(login)}
              className="w-full flex flex-col gap-[5dvh] items-center justify-center">
              <div className="w-[50%] flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t("email")}
                          {...field}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center justify-between relative">
                            <Input
                              placeholder={t("password")}
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

                  <p className="text-[0.8rem] font-medium">
                    <Link
                      href="forget-password"
                      className="hover:underline underline-offset-2">
                      {t("forgotPassword")}
                    </Link>
                  </p>
                </div>
              </div>
              {!loading && (
                <Button
                  className="w-[20%]"
                  type="submit">
                  {t("login")}
                </Button>
              )}
              {loading && (
                <Button className="w-[20%]">
                  <Loading />
                </Button>
              )}
            </form>
          </Form>
        </div>
      </Card >
      <div className="w-[40%] flex flex-col items-left">
        <p className="text-sm text-foreground">
          {t("noAccount.text")}{" "}
          <Link
            target="_blank"
            href="#"
            className="hover:underline underline-offset-2">
            {t("noAccount.link")}
          </Link>
        </p>
      </div>
    </div >
  );
}
