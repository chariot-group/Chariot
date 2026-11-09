"use client";

import type { ComponentProps } from "react";
import { createLazyDialog } from "@/components/lazy/createLazyComponent";

/**
 * Dialogs reachable from the app layout (header, sidebar) or heavy sheet actions,
 * fetched on first open instead of shipping in every route's initial JS.
 * @see FR-web-first-load-performance
 */

type SessionCommunityLibraryDialogProps = ComponentProps<
  typeof import("@/components/dialogs/SessionCommunityLibraryDialog").SessionCommunityLibraryDialog
>;
type ExportCharacterSheetPdfDialogProps = ComponentProps<
  typeof import("@/components/dialogs/ExportCharacterSheetPdfDialog").ExportCharacterSheetPdfDialog
>;
type DuplicateCharacterDialogProps = ComponentProps<
  typeof import("@/components/dialogs/DuplicateCharacterDialog").DuplicateCharacterDialog
>;
type DeletePlayerWithCompanionsDialogProps = ComponentProps<
  typeof import("@/components/layout/Sidebar/shared/DeletePlayerWithCompanionsDialog").DeletePlayerWithCompanionsDialog
>;
type JoinSessionDialogProps = ComponentProps<
  typeof import("@/components/dialogs/JoinSessionDialog").JoinSessionDialog
> & { open: boolean };
type ReleaseNotesModalProps = ComponentProps<
  typeof import("@/components/dialogs/ReleaseNotesModal").ReleaseNotesModal
> & { onOpenChange?: (open: boolean) => void };

export const LazySessionCommunityLibraryDialog = createLazyDialog<SessionCommunityLibraryDialogProps>(() =>
  import("@/components/dialogs/SessionCommunityLibraryDialog").then((m) => ({
    default: m.SessionCommunityLibraryDialog,
  })),
);

export const LazyExportCharacterSheetPdfDialog = createLazyDialog<ExportCharacterSheetPdfDialogProps>(() =>
  import("@/components/dialogs/ExportCharacterSheetPdfDialog").then((m) => ({
    default: m.ExportCharacterSheetPdfDialog,
  })),
);

export const LazyDuplicateCharacterDialog = createLazyDialog<DuplicateCharacterDialogProps>(() =>
  import("@/components/dialogs/DuplicateCharacterDialog").then((m) => ({
    default: m.DuplicateCharacterDialog,
  })),
);

export const LazyDeletePlayerWithCompanionsDialog = createLazyDialog<DeletePlayerWithCompanionsDialogProps>(() =>
  import("@/components/layout/Sidebar/shared/DeletePlayerWithCompanionsDialog").then((m) => ({
    default: m.DeletePlayerWithCompanionsDialog,
  })),
);

export const LazyJoinSessionDialog = createLazyDialog<JoinSessionDialogProps>(() =>
  import("@/components/dialogs/JoinSessionDialog").then((m) => ({ default: m.JoinSessionDialog })),
);

/** `onOpenChange(false)` is only called on a failed fetch, so the notes are not marked as seen. */
export const LazyReleaseNotesModal = createLazyDialog<ReleaseNotesModalProps>(() =>
  import("@/components/dialogs/ReleaseNotesModal").then((m) => ({ default: m.ReleaseNotesModal })),
);
