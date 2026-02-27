"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCampaigns } from "@/hooks/useCampaigns";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface CreateCampaignDialogProps {
    /** The element that opens the dialog (e.g. a Button). */
    children: React.ReactNode;
}

export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
    const t = useTranslations("sidebar");
    const tCommon = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { createCampaign, refreshCampaigns } = useCampaigns({ autoFetch: false });

    const handleCreate = async () => {
        if (!campaignName.trim()) {
            showToast(tCommon("errors.campaignNameRequired"), "error");
            return;
        }

        setIsCreating(true);
        try {
            const newCampaign = await createCampaign({
                label: campaignName.trim(),
                groups: {
                    active: [],
                    archived: [],
                },
            });

            showToast(t("campaignCreatedSuccess", { name: newCampaign.label }), "success");
            // Rafraîchir la liste des campagnes
            await refreshCampaigns();
            setOpen(false);
            setCampaignName("");
        } catch (error) {
            console.error("Error creating campaign:", error);
            showToast(tCommon("errors.campaignCreationFailed"), "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setCampaignName("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isCreating) {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("createCampaignDialogTitle")}</DialogTitle>
                    <DialogDescription>{t("createCampaignDialogDescription")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="campaign-name">{t("campaignName")}</Label>
                        <Input
                            id="campaign-name"
                            placeholder={t("campaignNamePlaceholder")}
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isCreating}
                            autoFocus
                            className="rounded-[15px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isCreating}>
                            {tCommon("cancel")}
                        </Button>
                    </DialogClose>
                    <Button onClick={handleCreate} disabled={isCreating || !campaignName.trim()}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {tCommon("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
