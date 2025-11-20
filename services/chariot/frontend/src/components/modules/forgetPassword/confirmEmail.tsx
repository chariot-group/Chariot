"use client";

import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import AuthService from "@/services/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ConfirmEmailProps {
  setStep: (step: 1 | 2 | 3) => void;
  setUserId: (userId: string) => void;
  cancel: () => void
}
export default function ConfirmEmail({ setStep, setUserId, cancel }: ConfirmEmailProps) {
  const t = useTranslations("confirmEmail");
  const { success, error } = useToast();

  const [loading, setLoading] = useState<boolean>(false);

  const confirmEmailSchema = z.object({
    email: z.string().email(t("toasts.emailRequired")),
  });

  const form = useForm<z.infer<typeof confirmEmailSchema>>({
    resolver: zodResolver(confirmEmailSchema),
    defaultValues: {
      email: ""
    },
  });

  const sendEmail = useCallback(async (value: z.infer<typeof confirmEmailSchema>) => {
    try {

      setLoading(true);
      let locale = window.location.pathname.split("/")[1];
      let reponse = await AuthService.resetPassword(value.email, locale);
      if (reponse.statusCode && reponse.statusCode !== 200) {
        setUserId(value.email);
      } else {
        setUserId(reponse.data._id);
      }
      success(t("toasts.sendingEmail"));
      setLoading(false);
      setStep(2);
    } catch (e) {
      error(t("toasts.internal"));
      setLoading(false);
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
          onSubmit={form.handleSubmit(sendEmail)}
          className="w-full flex flex-col gap-[5dvh] items-center justify-center">
          <div className="w-[50%] flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholder")}
                      {...field}
                      className="bg-background"
                    />
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
            {!loading && (
              <Button
                type="submit">
                {t("send")}
              </Button>
            )}
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
