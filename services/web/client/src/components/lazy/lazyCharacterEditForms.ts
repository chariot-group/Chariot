"use client";

import type { JSXElementConstructor } from "react";
import { createLazyComponent, createLazyDialog } from "@/components/lazy/createLazyComponent";

/**
 * Character sheet edit forms, fetched when the user enters edit mode so the
 * read-only sheet (and the layout) does not ship them.
 * @see FR-web-first-load-performance
 */

type PropsOf<M> = M extends { default: JSXElementConstructor<infer P> } ? P : never;

export const LazyPlayerGeneralTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/general/form/PlayerGeneralTabEdit")>
>(() => import("@/components/character/tabContents/general/form/PlayerGeneralTabEdit"));

export const LazyNpcGeneralTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/general/form/NpcGeneralTabEdit")>
>(() => import("@/components/character/tabContents/general/form/NpcGeneralTabEdit"));

export const LazyPlayerBattleTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/battle/form/PlayerBattleTabEdit")>
>(() => import("@/components/character/tabContents/battle/form/PlayerBattleTabEdit"));

export const LazyNPCBattleTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/battle/form/NPCBattleTabEdit")>
>(() => import("@/components/character/tabContents/battle/form/NPCBattleTabEdit"));

export const LazyCharacterMagicTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/magic/form/CharacterMagicTabEdit")>
>(() => import("@/components/character/tabContents/magic/form/CharacterMagicTabEdit"));

export const LazyCharacterInventoryTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit")>
>(() => import("@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit"));

export const LazyCharacterHistoryTabEdit = createLazyComponent<
  PropsOf<typeof import("@/components/character/tabContents/history/form/CharacterHistoryTabEdit")>
>(() => import("@/components/character/tabContents/history/form/CharacterHistoryTabEdit"));

export const LazyCodexSpellSearchDialog = createLazyDialog<
  PropsOf<typeof import("@/components/character/tabContents/magic/CodexSpellSearchDialog")>
>(() => import("@/components/character/tabContents/magic/CodexSpellSearchDialog"));
