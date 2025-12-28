import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LANGUAGES } from "@/constants/CharacterConstants";
import { cn } from "@/lib/utils";
import INpc from "@/models/npc/INpc";
import { Check, DotIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcLanguagesSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [languages, setLanguages] = useState<string[]>(npc.stats.languages);

  const changeLanguages = (value: string[]) => {
    setLanguages(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        languages: value,
      },
    });
  };

  const addLanguage = () => {
    changeLanguages([...languages, ""]);
  };

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const removeLanguage = (index: number) => {
    const newLanguages = [...languages];
    newLanguages.splice(index, 1);
    changeLanguages(newLanguages);
  };

  const handleLanguageChange = (index: number, value: string) => {
    const newLanguages = [...languages];
    newLanguages[index] = value;
    changeLanguages(newLanguages);
  };

  const getTranslatedLanguages = (): string[] => {
    let langs: string[] = [];
    LANGUAGES.forEach((lang) => {
      const translated = t(`languages.items.${lang}`, { defaultValue: lang });
      if (translated !== lang) {
        langs.push(translated);
      } else {
        langs.push(lang);
      }
    });
    return langs;
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <div className="flex flex-row gap-3 w-full h-full">
        <div className="flex flex-col gap-3 w-full h-full">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">{t("languages.title")}</h2>
            {isUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusCircleIcon
                    onClick={() => addLanguage()}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.addLanguage")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {languages.length <= 0 && <span className="text-gray-500 text-sm">{t("languages.noLanguage")}</span>}
          {languages.length > 0 && (
            <ul className="list-disc">
              {languages.map((language, index) => (
                <li
                  key={index}
                  className="text-sm flex flex-row gap-2 items-center">
                  <DotIcon className="text-foreground" />
                  <Popover open={openIndex === index} onOpenChange={(open) => setOpenIndex(open ? index : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost" disabled={!isUpdate}
                        className="w-[10vh] p-0 pl-1 h-7 border-none shadow-none text-left items-left justify-start font-normal disabled:opacity-1"
                      >
                        {language || t("languages.languageName")}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[150px] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t("languages.languageName")}
                          value={language ?? ""}
                          onValueChange={(val) => handleLanguageChange(index, val)}
                        />
                        <CommandEmpty>
                          {t("languages.noMatch")}
                        </CommandEmpty>
                        <CommandGroup>
                          {getTranslatedLanguages().map((option) => (
                            <CommandItem
                              key={option}
                              value={option}
                              onSelect={() => {
                                handleLanguageChange(index, option)
                                setOpenIndex(null)
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", language === option ? "opacity-100" : "opacity-0")} />
                              {option}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {isUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TrashIcon
                          onClick={() => removeLanguage(index)}
                          className="cursor-pointer text-primary"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("actions.deleteLanguage")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
