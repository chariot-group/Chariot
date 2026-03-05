"use client";

import Image, { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface ChoiceProps {
  image: StaticImageData;
  realm: string;
  link?: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}
export default function Choice({ image, realm, link, onClick, disabled = false, tooltip }: ChoiceProps) {
  const t = useTranslations("welcome");

  const buttonAria = t(`${realm}.button-aria`, { default: t(`${realm}.button`) });

  const buttonContent = disabled ? (
    <Button
      type="button"
      disabled
      aria-label={buttonAria}
      className="w-[90%] text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-10 sm:min-h-11 cursor-not-allowed opacity-60">
      {t(`${realm}.button`)}
    </Button>
  ) : onClick ? (
    <Button
      type="button"
      onClick={onClick}
      aria-label={buttonAria}
      className="w-[90%] hover:bg-primary/90 text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-10 sm:min-h-11">
      {t(`${realm}.button`)}
    </Button>
  ) : (
    <Button
      className="w-[90%] hover:bg-primary/90 text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-10 sm:min-h-11"
      asChild>
      <Link
        href={link || "#"}
        aria-label={buttonAria}>
        {t(`${realm}.button`)}
      </Link>
    </Button>
  );

  return (
    <article
      className="relative w-full max-w-md mx-auto mb-8 sm:mb-10 md:mb-12"
      role="listitem"
      aria-labelledby={`choice-title-${realm}`}>
      <Image
        src={image}
        alt=""
        aria-hidden="true"
        className="w-full h-auto rounded-t-lg"
      />
      <Card className="p-3 sm:p-4 md:p-5 lg:p-6 mt-2 sm:mt-3 md:mt-4 absolute left-1/2 -translate-x-1/2 -bottom-6 sm:-bottom-8 md:-bottom-10 w-[90%] sm:w-full flex flex-col items-center">
        <h3
          id={`choice-title-${realm}`}
          className="mb-2 sm:mb-3 text-center text-xs sm:text-sm md:text-base lg:text-lg font-semibold px-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: t.raw(`${realm}.title`) }}></h3>

        {disabled && tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-[90%] inline-flex">{buttonContent}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          buttonContent
        )}
      </Card>
    </article>
  );
}
