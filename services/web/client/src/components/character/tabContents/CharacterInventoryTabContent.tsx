import { NPC, Player } from "@/types/character";
import GP from "@public/assets/golden-piece.svg";
import SP from "@public/assets/silver-piece.svg";
import EP from "@public/assets/electrum-piece.svg";
import PP from "@public/assets/platinum-piece.svg";
import CP from "@public/assets/copper-piece.svg";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactNumber, formatNumberWithSpaces } from "@/utils/inventory.utils";

interface Props {
  accentColor: string;
  character: Player | NPC;
}

const CharacterInventoryTabContent = ({ accentColor, character }: Props) => {
  const t = useTranslations("characterDetail.inventory");

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex flex-col gap-4 w-full lg:w-2/5">
        <Card className="gap-2">
          <section
            aria-labelledby="coins-heading"
            aria-label={t("coinsRegion")}>
            <h2
              id="coins-heading"
              className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
              {t("coins")}
            </h2>
            <div className="flex flex-row flex-wrap md:justify-between justify-stretch gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                    role="text"
                    tabIndex={0}
                    aria-label={`${formatNumberWithSpaces(character?.treasure.pp ?? 0)} ${t("platinumPieces")}`}>
                    <Image
                      src={PP}
                      alt=""
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                    />
                    <span aria-hidden="true">
                      {formatCompactNumber(character?.treasure.pp ?? 0)} {t("pp")}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {formatNumberWithSpaces(character?.treasure.pp ?? 0)} {t("platinumPieces")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                    role="text"
                    tabIndex={0}
                    aria-label={`${formatNumberWithSpaces(character?.treasure.gp ?? 0)} ${t("goldPieces")}`}>
                    <Image
                      src={GP}
                      alt=""
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                    />
                    <span aria-hidden="true">
                      {formatCompactNumber(character?.treasure.gp ?? 0)} {t("gp")}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {formatNumberWithSpaces(character?.treasure.gp ?? 0)} {t("goldPieces")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                    role="text"
                    tabIndex={0}
                    aria-label={`${formatNumberWithSpaces(character?.treasure.ep ?? 0)} ${t("electrumPieces")}`}>
                    <Image
                      src={EP}
                      alt=""
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                    />
                    <span aria-hidden="true">
                      {formatCompactNumber(character?.treasure.ep ?? 0)} {t("ep")}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {formatNumberWithSpaces(character?.treasure.ep ?? 0)} {t("electrumPieces")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                    role="text"
                    tabIndex={0}
                    aria-label={`${formatNumberWithSpaces(character?.treasure.sp ?? 0)} ${t("silverPieces")}`}>
                    <Image
                      src={SP}
                      alt=""
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                    />
                    <span aria-hidden="true">
                      {formatCompactNumber(character?.treasure.sp ?? 0)} {t("sp")}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {formatNumberWithSpaces(character?.treasure.sp ?? 0)} {t("silverPieces")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
                    role="text"
                    tabIndex={0}
                    aria-label={`${formatNumberWithSpaces(character?.treasure.cp ?? 0)} ${t("copperPieces")}`}>
                    <Image
                      src={CP}
                      alt=""
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                    />
                    <span aria-hidden="true">
                      {formatCompactNumber(character?.treasure.cp ?? 0)} {t("cp")}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {formatNumberWithSpaces(character?.treasure.cp ?? 0)} {t("copperPieces")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>
        </Card>
        <Card className="gap-2">
          <section
            aria-labelledby="equipment-heading"
            aria-label={t("equipmentRegion")}>
            <h2
              id="equipment-heading"
              className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
              {t("equipment")}
            </h2>
            <p className="text-sm sm:text-base">{character?.treasure.equipment || t("noEquipment")}</p>
          </section>
        </Card>
      </div>
      <Card className="w-full lg:min-w-3/5 lg:max-w-3/5 gap-2">
        <section
          aria-labelledby="treasure-heading"
          aria-label={t("treasureRegion")}>
          <h2
            id="treasure-heading"
            className={`text-start text-2xl sm:text-3xl font-semibold mb-3 ${accentColor}`}>
            {t("treasure")}
          </h2>
          <p className="text-sm sm:text-base">{character?.treasure.treasure || t("noTreasure")}</p>
        </section>
      </Card>
    </div>
  );
};

export default CharacterInventoryTabContent;
