import { NPC, Player } from "@/types/character";
import GP from "@public/assets/pieces/golden-piece.svg";
import SP from "@public/assets/pieces/silver-piece.svg";
import EP from "@public/assets/pieces/electrum-piece.svg";
import PP from "@public/assets/pieces/platinum-piece.svg";
import CP from "@public/assets/pieces/copper-piece.svg";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactNumber, formatNumberWithSpaces } from "@/utils/inventory.utils";
import { UseFormReturn } from "react-hook-form";
import CharacterInventoryTabEdit from "@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit";

interface Props {
  accentColor: string;
  character: Player | NPC;
  form: UseFormReturn<any>;
  isEditing: boolean;
}

const CharacterInventoryTabContent = ({ accentColor, character, form, isEditing }: Props) => {
  const t = useTranslations("characterDetail.inventory");

  // Mode édition
  if (isEditing) {
    return <CharacterInventoryTabEdit character={character} accentColor={accentColor} form={form} />;
  }

  // Mode lecture
  return (
    <div className="w-full flex flex-col lg:flex-row gap-2 md:gap-4 items-start">
      <div className="flex flex-col gap-2 md:gap-4 w-full lg:w-2/5">
        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="coins-heading"
            className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
            {t("coins")}
          </h2>
          <div className="flex flex-row flex-wrap md:justify-between justify-stretch gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                  role="text"
                  tabIndex={0}
                  aria-label={`${formatNumberWithSpaces(character?.treasure.pp ?? 0)} ${t("platinumPieces")}`}>
                  <Image
                    src={PP}
                    alt=""
                    aria-hidden="true"
                    className="size-4 sm:size-5"
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
                  className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                  role="text"
                  tabIndex={0}
                  aria-label={`${formatNumberWithSpaces(character?.treasure.gp ?? 0)} ${t("goldPieces")}`}>
                  <Image
                    src={GP}
                    alt=""
                    aria-hidden="true"
                    className="size-4 sm:size-5"
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
                  className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                  role="text"
                  tabIndex={0}
                  aria-label={`${formatNumberWithSpaces(character?.treasure.ep ?? 0)} ${t("electrumPieces")}`}>
                  <Image
                    src={EP}
                    alt=""
                    aria-hidden="true"
                    className="size-4 sm:size-5"
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
                  className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                  role="text"
                  tabIndex={0}
                  aria-label={`${formatNumberWithSpaces(character?.treasure.sp ?? 0)} ${t("silverPieces")}`}>
                  <Image
                    src={SP}
                    alt=""
                    aria-hidden="true"
                    className="size-4 sm:size-5"
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
                  className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center cursor-help focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-primary rounded"
                  role="text"
                  tabIndex={0}
                  aria-label={`${formatNumberWithSpaces(character?.treasure.cp ?? 0)} ${t("copperPieces")}`}>
                  <Image
                    src={CP}
                    alt=""
                    aria-hidden="true"
                    className="size-4 sm:size-5"
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
        </Card>
        <Card className="gap-3 py-4 px-4 md:px-6">
          <h2
            id="equipment-heading"
            className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
            {t("equipment")}
          </h2>
          <p className="text-sm md:text-base wrap-break-words">{character?.treasure.equipment || t("noEquipment")}</p>
        </Card>
      </div>
      <Card className="w-full lg:min-w-3/5 lg:max-w-3/5 gap-3 py-4 px-4 md:px-6">
        <h2
          id="treasure-heading"
          className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
          {t("treasure")}
        </h2>
        <p className="text-sm md:text-base wrap-break-words">{character?.treasure.treasure || t("noTreasure")}</p>
      </Card>
    </div>
  );
};

export default CharacterInventoryTabContent;
