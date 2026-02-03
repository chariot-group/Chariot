import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import { Cake, Eye, PersonStanding, Ruler, Scissors, Weight } from "lucide-react";
import { useTranslations } from "next-intl";

interface CharacterHistoryTabContentProps {
  character: Character;
  accentColor: string;
}

export default function CharacterHistoryTabContent({ character, accentColor }: CharacterHistoryTabContentProps) {
  const t = useTranslations("characterDetail.history");

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
      {/* Apparence, Alliés et Liens */}
      <div className="flex flex-col gap-2 md:gap-4">
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="appearance-title">
          <h2
            id="appearance-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("appearance")}
          </h2>
          <div className="flex flex-col w-full gap-1 md:gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-0">
              <span className="flex flex-row gap-2 text-sm items-center">
                <Eye
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("eyes")}:</span>
                <span className="truncate">{character.appearance?.eyes}</span>
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Cake
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("age")}:</span>
                <span className="truncate">{character.appearance?.age}</span>
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <PersonStanding
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("skin")}:</span>
                <span className="truncate">{character.appearance?.skin}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-0">
              <span className="flex flex-row gap-2 text-sm items-center">
                <Ruler
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("height")}:</span>
                <span className="truncate">
                  {character.appearance?.height} ({character.stats?.size.charAt(0).toUpperCase()})
                </span>
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Weight
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("weight")}:</span>
                <span className="truncate">{character.appearance?.weight}</span>
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Scissors
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("hair")}:</span>
                <span className="truncate">{character.appearance?.hair}</span>
              </span>
            </div>
          </div>
        </Card>
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="allies-title">
          <h2
            id="allies-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("alliesAndOrgs")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background?.alliesAndOrgs}</p>
        </Card>
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="bonds-title">
          <h2
            id="bonds-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("bonds")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background?.bonds}</p>
        </Card>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2 md:gap-4">
        <Card
          className="gap-2 md:gap-4 h-full"
          role="region"
          aria-labelledby="description-title">
          <h2
            id="description-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("description")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.appearance?.description}</p>
        </Card>
      </div>

      {/* Traits, Idéaux et Défauts */}
      <div className="flex flex-col gap-2 md:gap-4">
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="traits-title">
          <h2
            id="traits-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("personalityTraits")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background.personalityTraits}</p>
        </Card>
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="ideals-title">
          <h2
            id="ideals-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("ideals")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background.ideals}</p>
        </Card>
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="flaws-title">
          <h2
            id="flaws-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("flaws")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background.flaws}</p>
        </Card>
      </div>

      {/* Histoire (full width) */}
      <div className="col-span-1 xl:col-span-3">
        <Card
          className="gap-2 md:gap-4"
          role="region"
          aria-labelledby="backstory-title">
          <h2
            id="backstory-title"
            className={`${accentColor} text-xl md:text-2xl font-semibold`}>
            {t("backstory")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character.background.backstory}</p>
        </Card>
      </div>
    </div>
  );
}
