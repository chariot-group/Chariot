import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ProfileFormData } from "@/hooks/useProfileForm";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isEnterWithModifiers, isEnterWithoutModifiers, isTypingInInputElement } from "@/utils/keyboard.utils";
import { MediaAvatarUpload } from "@/components/media/MediaAvatarUpload";
import MediaService from "@/services/MediaService";
import { invalidateMediaAvatarCache } from "@/lib/mediaAvatarCache";
import { useToast } from "@/hooks/useToast";

interface Props {
  user: User | null;
  form: UseFormReturn<ProfileFormData, null, ProfileFormData>;
  isLoading: boolean;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  onAvatarChange?: () => void;
}

export default function UpdateProfile({
  user,
  form,
  isLoading,
  onSubmit,
  onCancel,
  onAvatarChange,
}: Props) {
  const t = useTranslations("ProfilePage");
  const tEdit = useTranslations("ProfilePage.editProfile");
  const tAuth = useTranslations("auth");
  const toast = useToast();

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarRemove, setPendingAvatarRemove] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarCommitting, setIsAvatarCommitting] = useState(false);

  const isAvatarDirty = pendingAvatarFile !== null || pendingAvatarRemove;
  const hasPendingChanges = form.formState.isDirty || isAvatarDirty;
  const isBusy = isLoading || isAvatarCommitting;

  const resetAvatarDraft = useCallback(() => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setPendingAvatarFile(null);
    setPendingAvatarRemove(false);
  }, [avatarPreviewUrl]);

  const handlePendingAvatarFile = useCallback(
    (file: File) => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setPendingAvatarFile(file);
      setPendingAvatarRemove(false);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    },
    [avatarPreviewUrl],
  );

  const handlePendingAvatarRemove = useCallback(() => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setPendingAvatarFile(null);
    setPendingAvatarRemove(true);
    setAvatarPreviewUrl(null);
  }, [avatarPreviewUrl]);

  const handleSave = useCallback(
    async (data: ProfileFormData) => {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }

      let avatarChanged = false;

      try {
        if (pendingAvatarFile) {
          setIsAvatarCommitting(true);
          await MediaService.uploadUserAvatar(pendingAvatarFile);
          avatarChanged = true;
          if (user?.keycloakId) {
            invalidateMediaAvatarCache("user", user.keycloakId);
          }
        } else if (pendingAvatarRemove && user?.avatar?.trim()) {
          setIsAvatarCommitting(true);
          await MediaService.deleteUserAvatar();
          avatarChanged = true;
          if (user?.keycloakId) {
            invalidateMediaAvatarCache("user", user.keycloakId);
          }
        }

        await onSubmit(data);
        resetAvatarDraft();

        if (avatarChanged) {
          onAvatarChange?.();
        }
      } catch {
        toast.error(tEdit("errorMessage"));
      } finally {
        setIsAvatarCommitting(false);
      }
    },
    [
      form,
      onAvatarChange,
      onSubmit,
      pendingAvatarFile,
      pendingAvatarRemove,
      resetAvatarDraft,
      tEdit,
      toast,
      user?.avatar,
      user?.keycloakId,
    ],
  );

  const handleCancel = useCallback(() => {
    resetAvatarDraft();
    onCancel();
  }, [onCancel, resetAvatarDraft]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
        return;
      }

      if (!isEnterWithoutModifiers(event) || isTypingInInputElement(event.target)) return;
      if (!hasPendingChanges) return;

      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit(handleSave)();
    };

    window.addEventListener("keydown", handleGlobalShortcuts, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts, true);
    };
  }, [form, handleCancel, handleSave, hasPendingChanges]);

  const editingAvatarStoredValue = pendingAvatarRemove ? "" : user?.avatar;

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
        className="relative w-full xl:w-1/2 aspect-video overflow-hidden rounded-[15px]"
        role="img"
        aria-label={user?.username ? `${user.username} profile picture` : "Default profile picture"}>
        {user?.keycloakId ? (
          <MediaAvatarUpload
            scope="user"
            entityId={user.keycloakId}
            storedValue={editingAvatarStoredValue}
            size="profile"
            alt={user.username ? `${user.username} profile picture` : "Profile picture"}
            deferUpload
            previewUrl={avatarPreviewUrl}
            onPendingFile={handlePendingAvatarFile}
            onPendingRemove={handlePendingAvatarRemove}
            disabled={isBusy}
            className="size-full"
          />
        ) : null}
      </div>
      <div className="w-full xl:w-1/2 h-full">
        <form
          id="form-update-profile"
          className="h-full"
          onSubmit={form.handleSubmit(handleSave)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              handleCancel();
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
                        disabled={isBusy}
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
                        disabled={isBusy}
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
            <div className="flex flex-col gap-3 sm:gap-4">
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
                      disabled={isBusy}
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isBusy}
                  aria-label={tEdit("cancelUpdate")}>
                  {tEdit("cancelUpdate")}
                </Button>
                <Button
                  type="submit"
                  disabled={isBusy || !hasPendingChanges || !form.formState.isValid}
                  aria-label={tEdit("updateProfile")}
                  aria-busy={isBusy}>
                  {isBusy ? tAuth("loading") : tEdit("updateProfile")}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    </Card>
  );
}
