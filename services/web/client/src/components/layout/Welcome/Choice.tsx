"use client";

import Image, { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "use-intl";
import Link from "next/link";

export interface ChoiceProps {
  image: StaticImageData;
  realm: string;
  link?: string;
  onClick?: () => void;
}
export default function Choice({ image, realm, link, onClick }: ChoiceProps) {
  const t = useTranslations("welcome");

  const buttonAria = t(`${realm}.button-aria`, { default: t(`${realm}.button`) });

  const buttonContent = onClick ? (
    <Button
      type="button"
      onClick={onClick}
      aria-label={buttonAria}
      className="w-[90%] text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-10 sm:min-h-11">
      {t(`${realm}.button`)}
    </Button>
  ) : (
    <Button
      className="w-[90%] text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-10 sm:min-h-11"
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
      className="w-full max-w-md mx-auto"
      role="listitem"
      aria-labelledby={`choice-title-${realm}`}
      aria-describedby={`choice-description-${realm}`}>
      <Image
        src={image}
        alt=""
        loading={"eager"}
        aria-hidden="true"
        className="w-full h-auto rounded-t-lg"
      />
      <Card className="p-3 sm:p-4 md:p-5 lg:p-6 w-full flex flex-col items-center -translate-y-10">
        <h3
          id={`choice-title-${realm}`}
          className="mb-2 sm:mb-3 text-center text-xs sm:text-sm md:text-base lg:text-lg font-semibold px-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: t.raw(`${realm}.title`) }}></h3>

        <p
          id={`choice-description-${realm}`}
          className="mb-4 text-center text-xs sm:text-sm text-muted-foreground px-2">
          {t(`${realm}.description`)}
        </p>

        {buttonContent}
      </Card>
    </article>
  );
}
