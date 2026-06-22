"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useUser } from "@/hooks/useUser";
import {
  buildDataRequestMailto,
  buildDeleteAccountMailto,
  buildGdprExportFilename,
  buildProfileExportPayload,
  PRIVACY_POLICY_URL,
  serializeProfileExportPayload,
} from "@/lib/gdpr";
import userService from "@/services/UserService";
import { Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function ProfileGdprActions() {
  const t = useTranslations("ProfilePage.gdpr");
  const toast = useToast();
  const locale = useLocale();
  const { user } = useUser({ autoFetch: false });
  const [isExporting, setIsExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const freshUser = await userService.getCurrentUser();
      const payload = buildProfileExportPayload(freshUser);
      const blob = new Blob([serializeProfileExportPayload(payload)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildGdprExportFilename();
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const openMailto = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.click();
  };

  const handleDataRequest = () => {
    if (!user) return;
    openMailto(buildDataRequestMailto(user, locale));
  };

  const handleDeleteRequest = () => {
    if (!user) return;
    openMailto(buildDeleteAccountMailto(user, locale));
    setDeleteDialogOpen(false);
  };

  return (
    <Card
      className="gap-6 sm:gap-8"
      role="region"
      aria-labelledby="gdpr-heading">
      <div className="flex flex-col gap-2">
        <h3
          id="gdpr-heading"
          className="text-lg sm:text-xl font-bold">
          {t("title")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex flex-col divide-y divide-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">{t("exportTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("exportDescription")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting || !user}
            aria-busy={isExporting}
            aria-label={t("exportAriaLabel")}
            className="w-full sm:w-auto shrink-0"
            onClick={handleExport}>
            <Download
              className="h-4 w-4"
              aria-hidden="true"
            />
            {isExporting ? t("exporting") : t("exportAction")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">{t("dataRequestTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("dataRequestDescription")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!user}
            aria-label={t("dataRequestAriaLabel")}
            className="w-full sm:w-auto shrink-0"
            onClick={handleDataRequest}>
            <FileText
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t("dataRequestAction")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">{t("deleteTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("deleteDescription")}</p>
          </div>
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={!user}
                aria-label={t("deleteAriaLabel")}
                className="w-full sm:w-auto shrink-0">
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t("deleteAction")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
                <DialogDescription>{t("deleteDialogDescription")}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}>
                  {t("deleteDialogCancel")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteRequest}>
                  {t("deleteDialogConfirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {PRIVACY_POLICY_URL ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base">{t("privacyPolicyTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("privacyPolicyDescription")}</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto shrink-0">
              <Link
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("privacyPolicyAriaLabel")}>
                <ExternalLink
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t("privacyPolicyAction")}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
