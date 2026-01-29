"use client";

import Image, { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "use-intl";
import Link from "next/link";

export interface ChoiceProps {
  image: StaticImageData;
  realm: string;
  link: string;
}
export default function Choice({ image, realm, link }: ChoiceProps) {
  const t = useTranslations("welcome");

  return (
    <div className="relative w-full max-w-md mx-auto mb-8 sm:mb-10 md:mb-12">
      <Image
        src={image}
        alt={t(`${realm}.alt`)}
        className="w-full h-auto rounded-t-lg"
      />
      <Card className="p-3 sm:p-4 md:p-5 lg:p-6 mt-2 sm:mt-3 md:mt-4 absolute left-1/2 -translate-x-1/2 -bottom-6 sm:-bottom-8 md:-bottom-10 w-[90%] sm:w-full flex flex-col items-center">
        <h3
          className="mb-2 sm:mb-3 text-center text-xs sm:text-sm md:text-base lg:text-lg font-semibold px-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: t.raw(`${realm}.title`) }}></h3>

        <Link
          href={link}
          className="w-full">
          <Button className="w-full hover:bg-primary/90 text-xs sm:text-sm md:text-base lg:text-base px-3 sm:px-4 py-2 sm:py-2.5 whitespace-normal min-h-[2.5rem] sm:min-h-[2.75rem]">
            {t(`${realm}.button`)}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
