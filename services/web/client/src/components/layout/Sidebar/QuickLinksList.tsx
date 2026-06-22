"use client";

import { ChevronDown, ExternalLink, Link as LinkIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuickLinks } from "@/hooks/useQuickLinks";
import { AddQuickLinkDialog } from "@/components/dialogs/AddQuickLinkDialog";
import { getIconByName } from "@/lib/quickLinkIcons";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import type { QuickLink } from "@/types/quickLink";

interface QuickLinksListProps {
  campaignId?: string | null;
  disabled?: boolean;
}

function getCollapseStorageKey(campaignId?: string | null) {
  return campaignId ? "quicklinks-collapsed:gm" : "quicklinks-collapsed:player";
}

export function QuickLinksList({ campaignId, disabled = false }: QuickLinksListProps) {
  const t = useTranslations("sidebar.quickLinks");
  const { links, addLink, updateLink, removeLink } = useQuickLinks(campaignId);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);

  const storageKey = getCollapseStorageKey(campaignId);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(collapsed));
  }, [collapsed, storageKey]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const handleDelete = async () => {
    if (!pendingDeleteId || isDeleting) return;
    setIsDeleting(true);
    const success = await removeLink(pendingDeleteId);
    setIsDeleting(false);
    if (success) {
      setPendingDeleteId(null);
    } else {
      showToast(t("deleteError"), "error");
    }
  };

  const handleAdd = async (dto: Parameters<typeof addLink>[0]) => {
    const success = await addLink(dto);
    if (!success) showToast(t("addError"), "error");
    return success;
  };

  const handleEdit = async (id: string, dto: Parameters<typeof updateLink>[1]) => {
    const success = await updateLink(id, dto);
    if (!success) showToast(t("editError"), "error");
    return success;
  };

  const buildLinkActions = (link: QuickLink): SidebarActionItem[] => {
    if (disabled) return [];
    return [
      {
        id: "edit",
        label: t("edit"),
        onSelect: () => setEditingLink(link),
      },
      {
        id: "delete",
        label: t("delete"),
        variant: "destructive",
        onSelect: () => setPendingDeleteId(link._id),
      },
    ];
  };

  if (links.length === 0 && disabled) return null;

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("expandAriaLabel") : t("collapseAriaLabel")}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded">
          <LinkIcon
            className="h-3 w-3 shrink-0"
            aria-hidden="true"
          />
          <span className="min-w-0 truncate">{t("title")}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 transition-transform duration-200",
              collapsed && "-rotate-90",
            )}
            aria-hidden="true"
          />
        </button>

        {!disabled && (
          <AddQuickLinkDialog
            campaignId={campaignId}
            onAdd={handleAdd}>
            <button
              type="button"
              aria-label={t("addLinkAriaLabel")}
              className="ml-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/40 transition-all hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50">
              <Plus
                className="h-3 w-3"
                aria-hidden="true"
              />
            </button>
          </AddQuickLinkDialog>
        )}
      </div>

      {!collapsed && links.length > 0 && (
        <ul
          className="flex flex-col gap-1 overflow-y-auto"
          style={{ maxHeight: "calc(5 * (1.75rem + 0.25rem))" }}
          role="list"
          aria-label={t("title")}>
          {links.map((link) => {
            const Icon = getIconByName(link.icon);
            const actions = buildLinkActions(link);

            return (
              <li key={link._id}>
                <SidebarItemWithActions
                  actions={actions}
                  disabled={disabled}
                  contextMenuLabel={t("linkActions", { label: link.label })}
                  className="rounded-[12px] transition-all duration-150 hover:bg-white/10">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} (${t("opensInNewTab")})`}
                    className={cn(
                      "group/ql flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[12px] px-3 py-1.5 text-sm text-white/70 transition-all duration-100",
                      "hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                    )}>
                    <Icon
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/ql:opacity-60"
                      aria-hidden="true"
                    />
                  </a>
                </SidebarItemWithActions>
              </li>
            );
          })}
        </ul>
      )}

      <AddQuickLinkDialog
        editLink={editingLink ?? undefined}
        onEdit={handleEdit}
        open={!!editingLink}
        onOpenChange={(open) => {
          if (!open) setEditingLink(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDeleteId(null);
        }}
        title={t("deleteLinkDialogTitle")}
        description={t("deleteLinkDialogDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
