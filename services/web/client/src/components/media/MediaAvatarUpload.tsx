"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import MediaService from "@/services/MediaService";
import { invalidateMediaAvatarCache } from "@/lib/mediaAvatarCache";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  MEDIA_AVATAR_ACCEPT_MIME,
  MEDIA_AVATAR_MAX_UPLOAD_BYTES,
  MEDIA_AVATAR_RECOMMENDED_HEIGHT_PX,
  MEDIA_AVATAR_RECOMMENDED_WIDTH_PX,
  MEDIA_AVATAR_ROUNDED_CLASS,
  MEDIA_AVATAR_SIZE_CLASS,
  type MediaAvatarScope,
} from "@/utils/media.utils";

const requirementsHintId = (scope: MediaAvatarScope, entityId: string) =>
  `avatar-requirements-${scope}-${entityId}`;

type MediaAvatarUploadProps = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
  sessionCode?: string | null;
  size?: "sheet" | "profile";
  alt: string;
  className?: string;
  /** Immediate API upload (profile). Deferred = local preview until parent saves (character sheet). */
  deferUpload?: boolean;
  previewUrl?: string | null;
  onPendingFile?: (file: File) => void;
  onPendingRemove?: () => void;
  onAvatarChange?: (avatar: string) => void;
  disabled?: boolean;
};

export function MediaAvatarUpload({
  scope,
  entityId,
  storedValue,
  sessionCode,
  size = "sheet",
  alt,
  className,
  deferUpload = false,
  previewUrl,
  onPendingFile,
  onPendingRemove,
  onAvatarChange,
  disabled = false,
}: MediaAvatarUploadProps) {
  const t = useTranslations("mediaAvatar");
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const useOverlayControls = deferUpload;

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) {
      return;
    }

    if (
      !MEDIA_AVATAR_ACCEPT_MIME.split(",").some(
        (accepted) =>
          accepted === file.type || (accepted.startsWith(".") && file.name.toLowerCase().endsWith(accepted)),
      )
    ) {
      toast.error(t("invalidType"));
      return;
    }

    if (file.size > MEDIA_AVATAR_MAX_UPLOAD_BYTES) {
      toast.error(t("tooLarge"));
      return;
    }

    if (deferUpload) {
      onPendingFile?.(file);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    try {
      const result =
        scope === "character"
          ? await MediaService.uploadCharacterAvatar(entityId, file, sessionCode)
          : await MediaService.uploadUserAvatar(file);

      invalidateMediaAvatarCache(scope, entityId);
      onAvatarChange?.(result.avatar);
      toast.success(t("uploadSuccess"));
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (disabled || (!storedValue?.trim() && !previewUrl?.trim())) {
      return;
    }

    if (deferUpload) {
      onPendingRemove?.();
      return;
    }

    setIsUploading(true);
    try {
      const result =
        scope === "character"
          ? await MediaService.deleteCharacterAvatar(entityId, sessionCode)
          : await MediaService.deleteUserAvatar();

      invalidateMediaAvatarCache(scope, entityId);
      onAvatarChange?.(result.avatar);
      toast.success(t("removeSuccess"));
    } catch {
      toast.error(t("removeError"));
    } finally {
      setIsUploading(false);
    }
  };

  const showRemove = Boolean(storedValue?.trim()) || Boolean(previewUrl?.trim());
  const roundedClass = MEDIA_AVATAR_ROUNDED_CLASS[size];
  const requirementsId = requirementsHintId(scope, entityId);
  const requirementsHint = t("requirementsHint", {
    width: MEDIA_AVATAR_RECOMMENDED_WIDTH_PX,
    height: MEDIA_AVATAR_RECOMMENDED_HEIGHT_PX,
    maxMb: MEDIA_AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024),
  });

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className={cn("relative overflow-hidden", MEDIA_AVATAR_SIZE_CLASS[size], roundedClass)}>
        <MediaAvatar
          scope={scope}
          entityId={entityId}
          storedValue={storedValue}
          size={size}
          sessionCode={sessionCode}
          alt={alt}
          priority
          overrideSrc={previewUrl}
          fillContainer
          className="size-full"
        />
        {useOverlayControls ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex justify-center gap-1 px-1.5 py-1",
              "bg-linear-to-t from-black/85 via-black/55 to-transparent",
            )}>
            <input
              ref={inputRef}
              type="file"
              accept={MEDIA_AVATAR_ACCEPT_MIME}
              className="sr-only"
              id={`avatar-upload-${scope}-${entityId}`}
              aria-label={t("uploadLabel")}
              aria-describedby={requirementsId}
              disabled={disabled || isUploading}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
              aria-controls={`avatar-upload-${scope}-${entityId}`}
              aria-describedby={requirementsId}
              className="size-7 text-white hover:bg-white/20 hover:text-white">
              <ImagePlus
                className="size-4"
                aria-hidden="true"
              />
            </Button>
            {showRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || isUploading}
                onClick={() => void handleRemove()}
                className="size-7 text-white hover:bg-red/30 hover:text-red"
                aria-label={t("remove")}>
                <Trash2
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!useOverlayControls ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_AVATAR_ACCEPT_MIME}
            className="sr-only"
            id={`avatar-upload-${scope}-${entityId}`}
            aria-label={t("uploadLabel")}
            aria-describedby={requirementsId}
            disabled={disabled || isUploading}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            aria-controls={`avatar-upload-${scope}-${entityId}`}
            aria-describedby={requirementsId}
            className="border-white/25 bg-gray text-white hover:border-primary hover:bg-primary hover:text-white">
            <ImagePlus
              className="size-4"
              aria-hidden="true"
            />
            {t("upload")}
          </Button>
          {showRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => void handleRemove()}
              className="text-gray-light hover:bg-red/15 hover:text-red"
              aria-label={t("remove")}>
              <Trash2
                className="size-4"
                aria-hidden="true"
              />
              {t("remove")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <p
        id={requirementsId}
        className={cn(
          "text-xs text-gray-light leading-snug text-center max-w-56",
          size === "sheet" && "max-sm:sr-only",
        )}>
        {requirementsHint}
      </p>
    </div>
  );
}
