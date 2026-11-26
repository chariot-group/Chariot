"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NameRegularizationStep from "@/components/account-gate/NameRegularizationStep";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser, updateUser } from "@/store/slices/userSlice";
import { getAccountGateSteps } from "@/lib/accountGate";
import type { User } from "@/types/user";

const preventClose = (event: Event) => event.preventDefault();

/**
 * Initial focus on the first field to correct. Focusing it explicitly also arms the focus trap:
 * the post-login navigation can move focus to the page behind right after the modal opens, and
 * the trap only pulls focus back to an element that was focused inside it.
 */
const focusFirstField = (event: Event) => {
  const content = event.currentTarget;
  if (!(content instanceof HTMLElement)) return;
  const field = content.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])");
  if (!field) return;
  event.preventDefault();
  field.focus();
};

export interface AccountGateModalProps {
  open: boolean;
}

/**
 * Single blocking modal shown while an account gate condition is unmet. It cannot be closed
 * (no close button, Escape or outside click) and the modal layer makes the app behind it inert;
 * logout stays available. Each correction updates the user in the store, which removes the step
 * and moves to the next one, or closes the gate.
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
export function AccountGateModal({ open }: AccountGateModalProps) {
  const t = useTranslations("AccountGate");
  const user = useAppSelector(selectUser);
  const { logout } = useKeycloak();
  const dispatch = useAppDispatch();

  const steps = getAccountGateSteps(user);
  if (!open || !user || steps.length === 0) return null;

  const step = steps[0];
  const handleSaved = (updated: User) => dispatch(updateUser(updated));

  return (
    <Dialog
      open
      onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={preventClose}
        onPointerDownOutside={preventClose}
        onInteractOutside={preventClose}
        onOpenAutoFocus={focusFirstField}
        className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="min-w-0 text-left">
          {steps.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {t("stepIndicator", { current: 1, total: steps.length })}
            </p>
          )}
          <DialogTitle className="text-xl break-words">{t(`${step}.title`)}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground break-words">
            {t(`${step}.description`)}
          </DialogDescription>
        </DialogHeader>

        {step === "name" && (
          <NameRegularizationStep
            key={user.keycloakId}
            user={user}
            onSaved={handleSaved}
          />
        )}

        <DialogFooter className="border-t border-border pt-4 sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void logout()}
            className="w-full sm:w-auto">
            <LogOut aria-hidden="true" />
            {t("logout")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
