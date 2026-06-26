"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { QUICK_LINK_ICONS } from "@/lib/quickLinkIcons";
import { CreateQuickLinkDto, UpdateQuickLinkDto, QuickLink } from "@/types/quickLink";
import { cn } from "@/lib/utils";

interface AddQuickLinkDialogProps {
  children?: React.ReactNode;
  campaignId?: string | null;
  /** When provided, the dialog opens in edit mode for the given link. */
  editLink?: QuickLink;
  onAdd?: (dto: CreateQuickLinkDto) => Promise<boolean>;
  onEdit?: (id: string, dto: UpdateQuickLinkDto) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const URL_REGEX = /^https?:\/\/.+/;

export function AddQuickLinkDialog({
  children,
  campaignId,
  editLink,
  onAdd,
  onEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddQuickLinkDialogProps) {
  const t = useTranslations("sidebar.quickLinks");
  const tCommon = useTranslations("common");

  const isEditMode = !!editLink;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(QUICK_LINK_ICONS[0].name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editLink) {
        setLabel(editLink.label);
        setUrl(editLink.url);
        setSelectedIcon(editLink.icon);
      } else {
        setLabel("");
        setUrl("");
        setSelectedIcon(QUICK_LINK_ICONS[0].name);
      }
    }
  }, [open, editLink]);

  const isValid = label.trim().length > 0 && label.trim().length <= 60 && URL_REGEX.test(url.trim());

  const handleOpenChange = (next: boolean) => {
    if (isSaving) return;
    if (controlledOnOpenChange) {
      controlledOnOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);

    let success = false;
    if (isEditMode && onEdit && editLink) {
      success = await onEdit(editLink._id, {
        icon: selectedIcon,
        url: url.trim(),
        label: label.trim(),
      });
    } else if (!isEditMode && onAdd) {
      success = await onAdd({
        icon: selectedIcon,
        url: url.trim(),
        label: label.trim(),
        campaignId: campaignId ?? null,
      });
    }

    setIsSaving(false);

    if (success) {
      handleOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !isSaving) {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("editLinkTitle") : t("addLinkTitle")}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editLinkDescription") : t("addLinkDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Icon picker */}
          <div className="flex flex-col gap-2">
            <Label>{t("iconLabel")}</Label>
            <div
              role="radiogroup"
              aria-label={t("iconLabel")}
              className="grid grid-cols-5 gap-2">
              {QUICK_LINK_ICONS.map(({ name, icon: Icon, label: iconLabel }) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={selectedIcon === name}
                  aria-label={iconLabel}
                  title={iconLabel}
                  onClick={() => setSelectedIcon(name)}
                  className={cn(
                    "flex items-center justify-center rounded-[12px] border p-2.5 transition-all duration-100",
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                    selectedIcon === name
                      ? "border-white bg-white/20 text-white"
                      : "border-white/20 bg-white/5 text-white/50 hover:border-white/40 hover:text-white/80",
                  )}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ql-label">{t("labelField")}</Label>
            <Input
              id="ql-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("labelPlaceholder")}
              maxLength={60}
              disabled={isSaving}
              autoFocus
              className="rounded-[15px]"
            />
          </div>

          {/* URL */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ql-url">{t("urlField")}</Label>
            <Input
              id="ql-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              disabled={isSaving}
              className="rounded-[15px]"
              aria-describedby="ql-url-hint"
            />
            <p id="ql-url-hint" className="text-xs text-white/40">
              {t("urlHint")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button onClick={() => void handleSave()} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isEditMode ? t("editLinkSave") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
