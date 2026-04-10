import { User } from "@/types/user";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { User as UserIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ProfileFormData } from "@/hooks/useProfileForm";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isEnterWithModifiers, isEnterWithoutModifiers, isTypingInInputElement } from "@/utils/keyboard.utils";

interface Props {
  user: User | null;
  form: UseFormReturn<ProfileFormData, null, ProfileFormData>;
  isLoading: boolean;
  onSubmit: (data: ProfileFormData) => void;
  onCancel: () => void;
}

export default function UpdateProfile({ user, form, isLoading, onSubmit, onCancel }: Props) {
  const t = useTranslations("ProfilePage");
  const tEdit = useTranslations("ProfilePage.editProfile");

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }

      if (!isEnterWithoutModifiers(event) || isTypingInInputElement(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit(onSubmit)();
    };

    window.addEventListener("keydown", handleGlobalShortcuts, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts, true);
    };
  }, [form, onCancel, onSubmit]);

  return (
    <Card
      className="flex flex-col xl:flex-row overflow-hidden"
      role="region"
      aria-labelledby="profile-info-heading">
      <h2
        id="profile-info-heading"
        className="sr-only">
        {t("pageTitle")}
      </h2>
      <div
        className="relative w-full xl:w-1/2 aspect-video"
        role="img"
        aria-label={user?.username ? `${user.username} profile picture` : "Default profile picture"}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-middle-light rounded-[15px]">
          <UserIcon
            className="h-16 w-16"
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="w-full xl:w-1/2 h-full">
        <form
          id="form-update-profile"
          className="h-full"
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
              return;
            }

            if (isEnterWithModifiers(event)) {
              event.preventDefault();
            }
          }}
          aria-label={tEdit("formLabel")}>
          <FieldGroup className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <p
                className="text-2xl sm:text-3xl lg:text-4xl font-bold wrap-break-word"
                aria-label="Username">
                {user?.username}
              </p>
              <div className="flex flex-row gap-2">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation={"vertical"}>
                      <label
                        htmlFor="firstName"
                        className="sr-only">
                        {tEdit("firstName")}
                      </label>
                      <Input
                        {...field}
                        id="firstName"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "firstName-error" : undefined}
                        aria-required="true"
                        placeholder={tEdit("firstName")}
                        autoComplete="given-name"
                        type="text"
                        disabled={isLoading}
                      />
                      {fieldState.error && (
                        <FieldError
                          id="firstName-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation={"vertical"}>
                      <label
                        htmlFor="lastName"
                        className="sr-only">
                        {tEdit("lastName")}
                      </label>
                      <Input
                        {...field}
                        id="lastName"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "lastName-error" : undefined}
                        aria-required="true"
                        placeholder={tEdit("lastName")}
                        autoComplete="family-name"
                        type="text"
                        disabled={isLoading}
                      />
                      {fieldState.error && (
                        <FieldError
                          id="lastName-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation={"vertical"}>
                  <label
                    htmlFor="email"
                    className="sr-only">
                    {tEdit("email")}
                  </label>
                  <Input
                    {...field}
                    id="email"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "email-error" : undefined}
                    aria-required="true"
                    placeholder={tEdit("email")}
                    autoComplete="email"
                    type="email"
                    disabled={isLoading}
                  />
                  {fieldState.error && (
                    <FieldError
                      id="email-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </div>
    </Card>
  );
}
