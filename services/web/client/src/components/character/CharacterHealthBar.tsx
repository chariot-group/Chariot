import Image from "next/image";
import HeartIcon from "@public/assets/icons/heart-icon.svg";
import { Skull } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface CharacterHealthBarProps {
  currentHP: number;
  maxHP: number;
  tempHP: number;
}

const CharacterHealthBar = ({ currentHP, maxHP, tempHP }: CharacterHealthBarProps) => {
  const t = useTranslations("characterDetail.combat");
  const isFullWithTemp = currentHP === maxHP && tempHP > 0;
  const visualMax = isFullWithTemp ? maxHP + tempHP : maxHP;

  const redPercent = (currentHP / visualMax) * 100;

  const bluePercent = tempHP > 0 ? Math.min(100 - redPercent, (tempHP / visualMax) * 100) : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative h-9 bg-white border border-black rounded-full overflow-hidden cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
          tabIndex={0}
          role="img"
          aria-label={`${t("healthPoints")}: ${currentHP} ${t("unperformedThrow")} ${maxHP}${tempHP > 0 ? ` (+${tempHP} ${t("hpAbbr")})` : ""}`}>
          {/* HP temporaires */}
          {bluePercent > 0 && (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-blue transition-all duration-300 rounded-full"
                style={{ width: `${redPercent + 10}%` }}
              />
              <div
                className="absolute inset-y-0 bg-blue transition-all duration-300 rounded-r-full"
                style={{
                  left: `${redPercent}%`,
                  width: `${bluePercent}%`,
                }}
              />
            </>
          )}

          {/* HP actuels */}
          <div
            className="absolute inset-y-0 left-0 bg-red transition-all duration-300 rounded-full"
            style={{ width: `${redPercent}%` }}
          />

          {/* OVERLAY UI */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            {currentHP > 0 || tempHP > 0 ? (
              <Image
                src={HeartIcon}
                alt=""
                aria-hidden="true"
                className="size-6 sm:size-7"
              />
            ) : (
              <Skull
                size={32}
                className="text-black"
                aria-hidden="true"
              />
            )}

            <div
              className="font-bold text-xl text-black"
              aria-hidden="true">
              {currentHP}/{maxHP}
            </div>

            <div
              className="text-xl font-medium text-black"
              aria-hidden="true">
              {tempHP > 0 ? `+${tempHP}${t("hpAbbr")}` : ""}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>{t("healthPointsTooltip")}</TooltipContent>
    </Tooltip>
  );
};

export default CharacterHealthBar;
