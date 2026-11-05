"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, BookOpenCheck } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Button, toggleButtonPressedClassName } from "@/components/ui/button";
import type { Character, NPC, Player, Spell, Spellcasting } from "@/types/character";
import {
  classWithSpellPrepared,
  countPreparedSpellsInList,
  getRemainingSpellSlots,
  hasLevel1OrHigherSpells,
  numberSpellsPrepare,
  toSpellcastingAbilityKey,
} from "@/utils/magic.utils";
import { isPlayer } from "@/utils/global.utils";
import { cn } from "@/lib/utils";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { useIsXlUp } from "@/hooks/use-mobile";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import ListCard from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import ListSelectRow from "@/components/character/tabContents/shared/listCard/ListSelectRow";
import SpellCastControls from "@/components/character/tabContents/magic/SpellCastControls";
import SpellPreparedPill from "@/components/character/tabContents/magic/SpellPreparedPill";
import SpellDetails from "@/components/character/tabContents/magic/shared/SpellDetails";
import {
  SpellcastingSelector,
  SpellcastingStats,
  SpellGroupHeader,
  SpellSlotsBadge,
} from "@/components/character/tabContents/magic/shared/SpellcastingParts";
import {
  buildSpellGroups,
  magicBentoGridClass,
  MAGIC_SLOTS,
  magicWideSlots,
  resolveSelectedSpellIndex,
  spellRequiresConcentration,
  spellRowValue,
  spellSummaryParts,
  type SpellGroup,
} from "@/components/character/tabContents/magic/shared/spellList";
import {
  useMagicSelection,
  type MagicSelectionState,
} from "@/components/character/tabContents/magic/shared/useMagicSelection";

interface CharacterMagicViewProps {
  character: Character;
  accentColor: string;
  /** Read mode: allows casting (session) and changing prepared spells (PATCH). */
  onCharacterUpdate?: (updated: Player | NPC) => void;
  /** Selected block / spell, shared with edit mode by the tab container. */
  selectionState?: MagicSelectionState;
}

/**
 * Magic tab, read mode: Spellcasting card + Spells list card. Rows expand in place; from `xl` the
 * selected spell is shown in a detail panel next to the list instead (wide read mode).
 * @see FR-character-magic-list-card
 */
export default function CharacterMagicView({
  character,
  accentColor,
  onCharacterUpdate,
  selectionState,
}: CharacterMagicViewProps) {
  const tClass = useTranslations("classes");
  const tMagic = useTranslations("characterDetail.magic");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const toast = useToast();
  const sessionCode = useActiveSessionCode();
  const { convertRange } = useDistanceUnit();
  const listHeadingId = useId();
  const detailHeadingId = useId();
  const detailPanelId = useId();
  const isWide = useIsXlUp();

  const spellcastingList = useMemo(() => character.spellcasting ?? [], [character.spellcasting]);
  const { selection, setBlock, setSpell: setSelectedSpell } = useMagicSelection(selectionState);
  const selectedIndex = selection.block;
  const selectedSpell = selection.spell;
  // Below `xl`, the selected spell (e.g. coming back from edit mode) starts expanded.
  const [openRows, setOpenRows] = useState<string[]>(() =>
    selection.spell === null ? [] : [spellRowValue(selection.spell)],
  );
  const [preparationEditMode, setPreparationEditMode] = useState(false);
  const [prepSaving, setPrepSaving] = useState(false);

  const activeIndex = Math.min(selectedIndex, Math.max(0, spellcastingList.length - 1));
  const activeSpellcasting: Spellcasting | null = spellcastingList[activeIndex] ?? null;
  const spells = activeSpellcasting?.spells ?? [];
  const isInnate = activeSpellcasting?.isInnate ?? false;
  const abilityKey = toSpellcastingAbilityKey(activeSpellcasting?.ability);
  const appliesPrepMechanic =
    activeSpellcasting !== null && isPlayer(character) && classWithSpellPrepared(activeSpellcasting) && !isInnate;
  const showPreparedControls =
    appliesPrepMechanic &&
    Boolean(onCharacterUpdate) &&
    activeSpellcasting !== null &&
    hasLevel1OrHigherSpells(activeSpellcasting);
  const maxPrepared =
    appliesPrepMechanic && activeSpellcasting ? numberSpellsPrepare(activeSpellcasting, character as Player) : 0;
  const preparedCount = appliesPrepMechanic ? countPreparedSpellsInList(spells) : 0;

  useEffect(() => {
    if (!showPreparedControls && preparationEditMode) setPreparationEditMode(false);
  }, [showPreparedControls, preparationEditMode]);

  const selectSpellcasting = (index: number) => {
    setBlock(index);
    setOpenRows([]);
    setPreparationEditMode(false);
  };

  const togglePreparedRemote = useCallback(
    async (spellIndex: number) => {
      if (!onCharacterUpdate || !isPlayer(character) || !activeSpellcasting) return;
      const spell = activeSpellcasting.spells[spellIndex];
      if (!spell || Number(spell.level) <= 0) return;

      const nextPrepared = spell.prepared !== true;
      if (nextPrepared && maxPrepared > 0) {
        const others = activeSpellcasting.spells.filter(
          (s, i) => i !== spellIndex && Number(s.level) > 0 && s.prepared === true,
        ).length;
        if (others >= maxPrepared) {
          toast.error(tMagic("spellPrepareLimitTooltip"));
          return;
        }
      }

      setPrepSaving(true);
      try {
        const list = spellcastingList.map((sc, index) => {
          if (index !== activeIndex) return sc;
          const nextSpells = [...sc.spells];
          nextSpells[spellIndex] = { ...nextSpells[spellIndex], prepared: nextPrepared };
          return { ...sc, spells: nextSpells };
        });
        const updated = (await CharacterService.updateCharacter(
          "players",
          character._id,
          { spellcasting: list },
          sessionCode,
        )) as Player;
        onCharacterUpdate(updated);
      } catch (error) {
        console.error(error);
        toast.error(tMagic("spellCastError"));
      } finally {
        setPrepSaving(false);
      }
    },
    [
      activeIndex,
      activeSpellcasting,
      character,
      maxPrepared,
      onCharacterUpdate,
      sessionCode,
      spellcastingList,
      tMagic,
      toast,
    ],
  );

  if (!activeSpellcasting) {
    return (
      <div
        className="w-full"
        role="region"
        aria-label={tMagic("mainRegion")}>
        <p className="py-8 text-center text-muted-foreground">{tMagic("noMagicAbilities")}</p>
      </div>
    );
  }

  const blockLabel = (sc: Spellcasting) => {
    if (!isPlayer(character)) return sc.className || tMagic("newSpellcasting");
    const cls = character.class.find((c) => c.name.toLowerCase() === sc.className.toLowerCase());
    return cls ? `${tClass(cls.name)} ${tMagic("level")} ${cls.level}` : sc.className || tMagic("newSpellcasting");
  };

  const groups = buildSpellGroups(spells, { isInnate, sort: true, preparedFirst: appliesPrepMechanic });
  const groupLabel = (group: SpellGroup) =>
    group.kind === "uses"
      ? group.value === null
        ? tMagic("npc.atWill")
        : tMagic("npc.usesPerDay", { count: group.value })
      : group.value === 0
        ? tMagic("cantrips")
        : tMagic("spellLevelShort", { level: group.value ?? 0 });

  /** Castable count of a level group (cantrips: unlimited). */
  const groupSlots = (group: SpellGroup) => {
    if (group.kind !== "level") return undefined;
    if (group.value === 0) {
      return (
        <span
          className="text-sm font-semibold"
          aria-label={tMagic("cantrips")}>
          ∞
        </span>
      );
    }
    const slots = getRemainingSpellSlots(activeSpellcasting, group.value ?? 0);
    return (
      <SpellSlotsBadge
        level={group.value ?? 0}
        current={slots?.current ?? 0}
        total={slots?.total ?? 0}
      />
    );
  };

  const renderDetails = (spell: Spell) => (
    <SpellDetails
      spell={spell}
      attackBonus={activeSpellcasting.attackBonus ?? null}
      isNpc={!isPlayer(character)}
      castControls={
        onCharacterUpdate ? (
          <SpellCastControls
            characterKind={isPlayer(character) ? "players" : "npcs"}
            character={character as Player | NPC}
            spellcasting={activeSpellcasting}
            selectedSpell={spell}
            accentColor={accentColor}
            onCharacterUpdate={onCharacterUpdate}
          />
        ) : undefined
      }
    />
  );

  const shownSpellIndex = isWide ? resolveSelectedSpellIndex(groups, selectedSpell) : null;

  const renderRow = (spellIndex: number, group: SpellGroup) => {
    const spell: Spell = spells[spellIndex];
    const value = spellRowValue(spellIndex);
    const name = spell.name || tMagic("newSpell");
    const isOpen = openRows.includes(value);
    const showPill = appliesPrepMechanic && Number(spell.level) > 0;
    const othersPrepared = spells.filter(
      (s, i) => i !== spellIndex && Number(s.level) > 0 && s.prepared === true,
    ).length;
    const meta: string[] = [...spellSummaryParts(spell, convertRange)];
    if (group.kind === "uses" && spell.usesPerDay != null) meta.push(`${spell.used ?? 0} / ${spell.usesPerDay}`);
    const label = tMagic("spellRowLabel", { name, group: groupLabel(group) });

    const trailing =
      spellRequiresConcentration(spell) || showPill ? (
        <span className="flex items-center gap-2">
          {spellRequiresConcentration(spell) && (
            <span className="hidden rounded-full bg-gray-middle-light px-2 py-0.5 text-xs text-muted-foreground @md:inline">
              {tMagic("concentration")}
            </span>
          )}
          {showPill && (
            <SpellPreparedPill
              isPrepared={spell.prepared === true}
              interactive={preparationEditMode && showPreparedControls && !prepSaving}
              prepareBlocked={spell.prepared !== true && maxPrepared > 0 && othersPrepared >= maxPrepared}
              onToggle={() => void togglePreparedRemote(spellIndex)}
              preparedTooltip={tMagic("preparedBookmarkPreparedTooltip")}
              unpreparedTooltip={tMagic("preparedBookmarkUnpreparedTooltip")}
              prepareBlockedTooltip={tMagic("spellPrepareLimitTooltip")}
              ariaPrepared={`${tMagic("preparedPillAriaPrepared")} : ${name}`}
              ariaUnprepared={`${tMagic("preparedPillAriaUnprepared")} : ${name}`}
            />
          )}
        </span>
      ) : undefined;

    if (isWide) {
      return (
        <ListSelectRow
          key={value}
          id={`${listHeadingId}-trigger-${spellIndex}`}
          name={name}
          meta={meta}
          metaStyle="pills"
          label={label}
          isSelected={shownSpellIndex === spellIndex}
          onSelect={() => setSelectedSpell(spellIndex)}
          controlsId={detailPanelId}
          trailing={trailing}
        />
      );
    }

    return (
      <ListRow
        key={value}
        id={`${listHeadingId}-${value}`}
        value={value}
        triggerId={`${listHeadingId}-trigger-${spellIndex}`}
        name={name}
        meta={meta}
        metaStyle="pills"
        triggerLabel={label}
        isOpen={isOpen}
        contentLabel={name}
        trailing={trailing}>
        {renderDetails(spell)}
      </ListRow>
    );
  };

  const allRows = spells.map((_, index) => spellRowValue(index));
  const wideSlots = magicWideSlots(spellcastingList.length > 1);
  const shownSpell = shownSpellIndex !== null ? spells[shownSpellIndex] : null;

  const groupedRows = groups.map((group) => (
    <Fragment key={group.key}>
      <SpellGroupHeader
        label={groupLabel(group)}
        accentColor={accentColor}
        trailing={groupSlots(group)}
      />
      {group.indices.map((index) => renderRow(index, group))}
    </Fragment>
  ));

  return (
    <div className={magicBentoGridClass(spellcastingList.length > 1)}>
      {spellcastingList.length > 1 && (
        <SpellcastingSelector
          className={MAGIC_SLOTS.selector}
          labels={spellcastingList.map(blockLabel)}
          selectedIndex={activeIndex}
          onSelect={selectSpellcasting}
        />
      )}

      <GeneralSectionCard
        headingId="magic-spellcasting-heading"
        title={tMagic("spellcastingTitle")}
        accentColor={accentColor}
        className={isWide ? wideSlots.spellcasting : MAGIC_SLOTS.spellcasting}>
        <SpellcastingStats
          className="min-w-0 @3xl:max-w-2xl"
          abilityName={abilityKey ? tAbilities(abilityKey) : (activeSpellcasting.ability ?? "")}
          attackBonus={activeSpellcasting.attackBonus}
          saveDC={activeSpellcasting.saveDC}
          prepared={appliesPrepMechanic ? { current: preparedCount, max: maxPrepared } : null}
        />
      </GeneralSectionCard>

      <ListCard
        headingId={listHeadingId}
        title={tMagic("spells")}
        count={spells.length}
        accentColor={accentColor}
        className={isWide ? wideSlots.spells : MAGIC_SLOTS.spells}
        bounded
        fill
        expanded={openRows.length > 0}
        onToggleAll={isWide ? undefined : () => setOpenRows(openRows.length > 0 ? [] : allRows)}
        expandLabel={tMagic("expandAll")}
        collapseLabel={tMagic("collapseAll")}
        emptyLabel={tMagic("noSpells")}
        toolbar={
          showPreparedControls ? (
            <div className="flex min-w-0 flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-pressed={preparationEditMode}
                className={cn("self-start", preparationEditMode && toggleButtonPressedClassName)}
                onClick={() => setPreparationEditMode((v) => !v)}>
                {preparationEditMode ? <BookOpenCheck aria-hidden="true" /> : <BookOpen aria-hidden="true" />}
                {preparationEditMode ? tMagic("finishChangingPrepared") : tMagic("changePreparedSpells")}
              </Button>
              {preparationEditMode && (
                <p
                  className="text-sm text-muted-foreground"
                  role="status">
                  {tMagic("preparationModeBanner")}
                </p>
              )}
            </div>
          ) : undefined
        }>
        {isWide ? (
          <div className="w-full">{groupedRows}</div>
        ) : (
          <Accordion
            type="multiple"
            value={openRows}
            onValueChange={(next) => {
              const opened = next.find((value) => !openRows.includes(value));
              if (opened) setSelectedSpell(Number(opened.replace("spell-", "")));
              setOpenRows(next);
            }}
            className="w-full">
            {groupedRows}
          </Accordion>
        )}
      </ListCard>

      {isWide && shownSpell && (
        <GeneralSectionCard
          headingId={detailHeadingId}
          title={shownSpell.name || tMagic("newSpell")}
          accentColor={accentColor}
          headingClassName="wrap-break-word"
          className={wideSlots.detail}>
          <div
            id={detailPanelId}
            className="-mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-[10px] pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-scrollbar-track"
            role="group"
            aria-labelledby={detailHeadingId}
            tabIndex={0}>
            {renderDetails(shownSpell)}
          </div>
        </GeneralSectionCard>
      )}
    </div>
  );
}
