"use client";

import { useCallback, useEffect, useState } from "react";
import QuickLinkService from "@/services/QuickLinkService";
import { QuickLink, CreateQuickLinkDto, UpdateQuickLinkDto } from "@/types/quickLink";

export function useQuickLinks(campaignId?: string | null) {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await QuickLinkService.getQuickLinks(campaignId);
      setLinks(data);
    } catch {
      setError("Failed to load quick links");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(
    async (dto: CreateQuickLinkDto): Promise<boolean> => {
      try {
        const created = await QuickLinkService.createQuickLink(dto);
        setLinks((prev) => [...prev, created]);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const updateLink = useCallback(
    async (id: string, dto: UpdateQuickLinkDto): Promise<boolean> => {
      try {
        const updated = await QuickLinkService.updateQuickLink(id, dto);
        setLinks((prev) => prev.map((l) => (l._id === id ? updated : l)));
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const removeLink = useCallback(async (id: string): Promise<boolean> => {
    try {
      await QuickLinkService.deleteQuickLink(id);
      setLinks((prev) => prev.filter((l) => l._id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { links, loading, error, addLink, updateLink, removeLink, refresh: fetchLinks };
}
