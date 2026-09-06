import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Character } from "@/types/character";
import { Cake, Eye, PersonStanding, Ruler, Scissors, Weight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";

interface CharacterHistoryViewProps {
  character: Character;
  accentColor: string;
}

export default function CharacterHistoryView({ character, accentColor }: CharacterHistoryViewProps) {
  const t = useTranslations("characterDetail.history");
  const tBattle = useTranslations("characterDetail.battle");
  const {
    displayHeight, heightLabel, secondaryHeight, secondaryHeightLabel,
    displayWeight, weightLabel, secondaryWeight, secondaryWeightLabel,
  } = useDistanceUnit();

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
      {/* Col 1: Apparence (spans 2 rows on xl, sizes to content — FR-character-history-appearance-fit) */}
      <div className="xl:row-span-2 self-start min-w-0 w-full">
        <Card
          className="gap-3 py-4 px-4 md:px-6 h-fit min-w-0 w-full"
          role="region"
          aria-labelledby="appearance-title">
          <h2
            id="appearance-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("appearance")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 items-start gap-3 md:gap-4 w-full min-w-0 [&>div]:min-w-0 [&>div]:h-fit">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("eyes")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0">{character?.appearance?.eyes}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cake
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("age")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0">{character?.appearance?.age}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PersonStanding
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("skin")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0">{character?.appearance?.skin}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ruler
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("height")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0 flex flex-row items-center gap-1">
                {character?.appearance?.height != null ? (
                  <span className="flex items-baseline gap-1">
                    <span>{displayHeight(Number(character.appearance.height))}{heightLabel}</span>
                    {secondaryHeight && (
                      <span className="text-[0.75em] text-muted-foreground/60">({secondaryHeight(Number(character.appearance.height))}{secondaryHeightLabel})</span>
                    )}
                  </span>
                ) : null}
                <Tooltip>
                  <TooltipTrigger>
                    ({tBattle(`sizesAbbr.${character?.stats?.size}` as Parameters<typeof t>[0])})
                  </TooltipTrigger>
                  <TooltipContent>
                    {tBattle(`sizes.${character?.stats?.size}` as Parameters<typeof t>[0])}
                  </TooltipContent>
                </Tooltip>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Weight
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("weight")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0 flex items-baseline gap-1">
                {character?.appearance?.weight != null ? (
                  <>
                    <span>{displayWeight(Number(character.appearance.weight))}{weightLabel}</span>
                    {secondaryWeight && (
                      <span className="text-[0.75em] text-muted-foreground/60">({secondaryWeight(Number(character.appearance.weight))}{secondaryWeightLabel})</span>
                    )}
                  </>
                ) : null}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scissors
                  className="shrink-0 w-4 h-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{t("hair")}</span>
              </div>
              <span className="text-sm pl-6 wrap-break-words min-w-0">{character?.appearance?.hair}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Cols 2–4 row 1: Traits | Alliés | Liens */}
      <Card
        className="gap-3 py-4 px-4 md:px-6 break-all"
        role="region"
        aria-labelledby="traits-title">
        <h2
          id="traits-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("personalityTraits")}
        </h2>
        <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
          {character?.background?.personalityTraits}
        </p>
      </Card>
      <Card
        className="gap-3 py-4 px-4 md:px-6 break-all"
        role="region"
        aria-labelledby="allies-title">
        <h2
          id="allies-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("alliesAndOrgs")}
        </h2>
        <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
          {character?.background?.alliesAndOrgs}
        </p>
      </Card>
      <Card
        className="gap-3 py-4 px-4 md:px-6 break-all"
        role="region"
        aria-labelledby="bonds-title">
        <h2
          id="bonds-title"
          className={`${accentColor} text-xl md:text-2xl font-semibold`}>
          {t("bonds")}
        </h2>
        <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{character?.background?.bonds}</p>
      </Card>

      {/* Cols 2–4 row 2: Idéaux | Défauts (equal width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 xl:col-start-2 xl:col-span-3">
        <Card
          className="gap-3 py-4 px-4 md:px-6 break-all"
          role="region"
          aria-labelledby="ideals-title">
          <h2
            id="ideals-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("ideals")}
          </h2>
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{character?.background?.ideals}</p>
        </Card>
        <Card
          className="gap-3 py-4 px-4 md:px-6 break-all"
          role="region"
          aria-labelledby="flaws-title">
          <h2
            id="flaws-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("flaws")}
          </h2>
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{character?.background?.flaws}</p>
        </Card>
      </div>

      {/* Ligne 2: Histoire | Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 col-span-1 lg:col-span-2 xl:col-span-4">
        <Card
          className="gap-3 py-4 px-4 md:px-6 break-all"
          role="region"
          aria-labelledby="backstory-title">
          <h2
            id="backstory-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("backstory")}
          </h2>
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">{character?.background?.backstory}</p>
        </Card>
        <Card
          className="gap-3 py-4 px-4 md:px-6 break-all"
          role="region"
          aria-labelledby="description-title">
          <h2
            id="description-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("description")}
          </h2>
          <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
            {character?.appearance?.description}
          </p>
        </Card>
      </div>
    </div>
  );
}
