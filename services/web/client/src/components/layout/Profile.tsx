"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useKeycloak } from "@/providers/KeycloakProvider";

export default function Profile() {
  const [isOpen, setIsOpen] = useState(false);
  const collapsibleTriggerRef = useRef<HTMLButtonElement>(null);
  const buttonLogoutRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Profile");
  const { logout } = useKeycloak();

  // Récupère les informations de l'utilisateur depuis le cache Redux
  const { user, loading } = useUser({ autoFetch: true });

  const getInitials = () => {
    if (!user) return "??";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonLogoutRef.current && buttonLogoutRef.current.contains(event.target as Node)) {
        logout();
        return;
      }

      if (collapsibleTriggerRef.current && !collapsibleTriggerRef.current.contains(event.target as Node)) {
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
      open={isOpen}
      onOpenChange={setIsOpen}
      className="relative">
      <CollapsibleTrigger
        ref={collapsibleTriggerRef}
        className="w-auto"
        disabled={loading}>
        <Avatar className="h-12 w-12 cursor-pointer">
          <AvatarImage
            src={user?.avatar || undefined}
            alt={user?.username || "User"}
          />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      </CollapsibleTrigger>
      <CollapsibleContent className="min-w-max flex-col bg-card py-1.5 px-3 transition-all duration-100 flex absolute top-14 right-0 text-popover-foreground rounded-[12px] border">
        <div className="px-2 py-1.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
          <Link
            className="flex items-center gap-2 rounded-[12px]"
            href={"/profile"}>
            <User className="shrink-0" /> <span className="inline-block min-w-[8rem]">{t("profile")}</span>
          </Link>
        </div>
        <div className="px-2 py-1.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
          <span
            ref={buttonLogoutRef}
            className="flex items-center gap-2 rounded-[12px]">
            <LogOut className="shrink-0" /> <span className="inline-block min-w-[8rem]">{t("logout")}</span>
          </span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
