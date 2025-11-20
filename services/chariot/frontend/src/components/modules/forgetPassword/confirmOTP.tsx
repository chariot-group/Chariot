"use client";

import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/useToast";
import AuthService from "@/services/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ConfirmOTPProps {
  setStep: (step: 1 | 2 | 3) => void;
  setOTP: (otp: string) => void;
  userId: string;
  cancel: () => void;
}
export default function ConfirmOTP({ setStep, setOTP, userId, cancel }: ConfirmOTPProps) {
  const t = useTranslations("confirmOTP");

  const [loading, setLoading] = useState<boolean>(false);
  const { success, error } = useToast();

  const verifyOTPSchema = z.object({
    otp: z.string().min(6, t("toasts.otpRequired")).max(6, t("toasts.otpRequired")),
  });

  const form = useForm<z.infer<typeof verifyOTPSchema>>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      otp: ""
    },
  });

  const verifyOTP = useCallback(async (value: z.infer<typeof verifyOTPSchema>) => {
    try {

      setLoading(true);
      let reponse = await AuthService.verifyOTP(userId, value.otp);
      if (reponse.statusCode && reponse.statusCode !== 200) {
        error(t("toasts.invalidOTP"));
        form.setError("otp", {
          message: t("toasts.invalidOTP"),
        });
        setLoading(false);
        return;
      }
      success(t("toasts.otpValid"));
      setOTP(value.otp);
      setLoading(false);
      setStep(3);
    } catch (e) {
      console.log(e);
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
          onSubmit={form.handleSubmit(verifyOTP)}
          className="w-full flex flex-col gap-[5dvh] items-center justify-center">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </div >
  );
}
