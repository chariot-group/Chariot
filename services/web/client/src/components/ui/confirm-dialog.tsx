"use client";

import * as React from "react";
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

interface ConfirmDialogProps {
    /** The element that opens the dialog (e.g. a Button). */
    children: React.ReactNode;
    /** Dialog title. */
    title: string;
    /** Confirmation message shown in the dialog body. */
    description: string;
    /** Label for the confirm button. Defaults to "Confirm". */
    confirmLabel?: string;
    /** Label for the cancel button. Defaults to "Cancel". */
    cancelLabel?: string;
    /** Visual variant of the confirm button. Defaults to "destructive". */
    confirmVariant?: React.ComponentProps<typeof Button>["variant"];
    /** Called when the user clicks the confirm button. */
    onConfirm: () => void;
}

export function ConfirmDialog({
    children,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmVariant = "destructive",
    onConfirm,
}: ConfirmDialogProps) {
    const [open, setOpen] = React.useState(false);

    const handleConfirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-sm rounded-[15px] bg-card">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant={confirmVariant}
                        className="text-black"
                        onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
