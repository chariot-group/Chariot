import {
  Archive,
  ArchiveRestore,
  Copy,
  FileDown,
  FolderInput,
  Pencil,
  Trash2,
  UserMinus,
  type LucideIcon,
} from "lucide-react";

/**
 * Default icon of each sidebar action id, shared by the context menu and the touch overflow menu
 * so both stay identical (FR-sidebar-context-actions). An explicit `SidebarActionItem.icon` wins.
 */
export const SIDEBAR_ACTION_ICONS: Readonly<Record<string, LucideIcon>> = {
  edit: Pencil,
  duplicate: Copy,
  move: FolderInput,
  archive: Archive,
  unarchive: ArchiveRestore,
  exportPdf: FileDown,
  delete: Trash2,
  "delete-all-archived": Trash2,
  removeFromSession: UserMinus,
};
