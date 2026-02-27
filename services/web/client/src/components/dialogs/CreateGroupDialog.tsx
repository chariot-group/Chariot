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
import { useGroups } from "@/hooks/useGroups";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface CreateGroupDialogProps {
    /** The element that opens the dialog (e.g. a Button). */
    children: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
    const t = useTranslations("sidebar");
    const tCommon = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { createGroup, refreshGroups } = useGroups();

    const handleCreate = async () => {
        if (!groupName.trim()) {
            showToast(tCommon("errors.groupNameRequired"), "error");
            return;
        }

        setIsCreating(true);
        try {
            const newGroup = await createGroup({
                label: groupName.trim(),
            });

            // Rafraîchir la liste des groupes (même pattern que pour les campagnes)
            await refreshGroups();
            showToast(t("groupCreatedSuccess", { name: newGroup.label }), "success");
            setOpen(false);
            setGroupName("");
        } catch (error) {
            console.error("Error creating group:", error);
            showToast(tCommon("errors.groupCreationFailed"), "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setGroupName("");
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
                    <DialogTitle>{t("createGroupDialogTitle")}</DialogTitle>
                    <DialogDescription>{t("createGroupDialogDescription")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="group-name">{t("groupName")}</Label>
                        <Input
                            id="group-name"
                            placeholder={t("groupNamePlaceholder")}
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
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
                    <Button onClick={handleCreate} disabled={isCreating || !groupName.trim()}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {tCommon("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
