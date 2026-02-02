"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, SquarePen } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import Token from "@public/assets/token.svg";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useUser({ autoFetch: true });
  const [viewNewPassword, setViewNewPassword] = useState<boolean>(false);
  const [viewConfirmNewPassword, setViewConfirmNewPassword] = useState<boolean>(false);

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(8, "Le mot de passe actuel doit contenir au moins 8 caractères"),
      newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
      confirmNewPassword: z
        .string()
        .min(8, "La confirmation du nouveau mot de passe doit contenir au moins 8 caractères"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Les nouveaux mots de passe ne correspondent pas",
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
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 py-4 md:py-8">
        <div className="flex flex-col gap-2">
          <Card className="flex flex-col sm:flex-row overflow-hidden">
            <div className="relative w-full sm:w-1/2 aspect-4/3">
              <Image
                fill
                className="object-cover rounded-[15px]"
                src={user?.avatar || "/default-avatar.png"}
                alt={"Profile Avatar"}
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
          <Card>
            <h2 className="text-xl font-bold">Changer de mot de passe</h2>
            <div className="px-2">
              <form
                id="form-reset-password"
                onSubmit={form.handleSubmit(onSubmit)}>
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
                          aria-invalid={fieldState.invalid}
                          placeholder={"Mot de passe actuel"}
                          autoComplete="off"
                          type="password"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
                            aria-invalid={fieldState.invalid}
                            placeholder={"Nouveau mot de passe"}
                            autoComplete="off"
                            type={viewNewPassword ? "text" : "password"}
                          />
                          <div
                            onClick={() => setViewNewPassword(!viewNewPassword)}
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors">
                            {viewNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </div>
                        </div>

                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
                            aria-invalid={fieldState.invalid}
                            placeholder={"Confirmer le nouveau mot de passe"}
                            autoComplete="off"
                            type={viewConfirmNewPassword ? "text" : "password"}
                          />
                          <div
                            onClick={() => setViewConfirmNewPassword(!viewConfirmNewPassword)}
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors">
                            {viewConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </div>
                        </div>

                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
                  className="relative">
                  <SquarePen className="absolute left-3" />
                  Modifier mon mot de passe
                </Button>
              </Field>
            </div>
          </Card>
        </div>
        <Card>
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-bold">Historique des sessions</h2>
            <Card className="bg-gray-middle-light px-3 py-2 rounded-[15px] flex flex-row items-center gap-6 justify-between">
              <span className="font-bold hidden xl:block">Vos tokens :</span>
              <span className="flex flex-row gap-1">
                20
                <Image
                  src={Token}
                  alt="token"
                />
              </span>
            </Card>
          </div>
          {/* historique des sessions */}
          <div className="flex justify-end">
            <Link
              href={"#"}
              className="relative">
              <Button className="rounded-[15px] px-5">Recharger mes tokens</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
