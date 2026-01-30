"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Profile() {
  const [isOpen, setIsOpen] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsibleRef.current) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <Collapsible
      ref={collapsibleRef}
      open={isOpen}
      onOpenChange={setIsOpen}
      className="absolute top-10 right-10">
      <CollapsibleTrigger className="w-auto">
        <Avatar className="h-12 w-12">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </CollapsibleTrigger>
      <CollapsibleContent className="min-w-max flex-col bg-card py-1.5 px-3 transition-all duration-100 flex absolute top-14 right-0 text-popover-foreground rounded-[12px] border">
        <div className="px-2 py-1.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
          <Link
            className="flex items-center gap-2 rounded-[12px]"
            href={"/profile"}>
            <User className="shrink-0" /> <span className="inline-block min-w-[8rem]">Profile</span>
          </Link>
        </div>
        <div className="px-2 py-1.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
          <span className="flex items-center gap-2 rounded-[12px]">
            <LogOut className="shrink-0" /> <span className="inline-block min-w-[8rem]">Se déconnecter</span>
          </span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
