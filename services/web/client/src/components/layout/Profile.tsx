"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useKeycloak } from "@/providers/KeycloakProvider";
import Token from "@public/assets/token.svg";

export default function Profile() {
  const [isOpen, setIsOpen] = useState(false);
  const collapsibleTriggerRef = useRef<HTMLButtonElement>(null);
  const collapsibleContentRef = useRef<HTMLDivElement>(null);
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
      const target = event.target as Node;
      const isOutsideTrigger = collapsibleTriggerRef.current && !collapsibleTriggerRef.current.contains(target);
      const isOutsideContent = collapsibleContentRef.current && !collapsibleContentRef.current.contains(target);

      if (isOutsideTrigger && isOutsideContent) {
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
        disabled={loading}
        aria-label={t("profile")}
        aria-expanded={isOpen}
        aria-haspopup="true">
        {user?.keycloakId ? (
          <MediaAvatar
            scope="user"
            entityId={user.keycloakId}
            storedValue={user.avatar}
            size="thumb"
            alt={user?.username ? `${user.username} avatar` : "User avatar"}
            className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer rounded-full"
          />
        ) : (
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer">
            <AvatarFallback className="bg-gray-middle-light">{getInitials()}</AvatarFallback>
          </Avatar>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent
        ref={collapsibleContentRef}
        role="menu"
        aria-label={t("profile")}
        className="min-w-max flex-col bg-card py-1.5 px-3 transition-all duration-100 flex absolute top-12 sm:top-14 right-0 text-popover-foreground rounded-[15px] border shadow-lg z-50">
        <div
          className="px-2 py-1.5 text-sm whitespace-nowrap border-b border-border"
          role="status"
          aria-live="polite"
          aria-label={t("wheelsBalanceAria", { balance: user?.balance ?? 0 })}>
          <span
            className="flex items-center gap-1.5 font-semibold text-sm sm:text-base"
            aria-hidden="true">
            {user?.balance ?? 0}
            <Image
              src={Token}
              alt=""
              aria-hidden="true"
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
            <span className="font-normal text-muted-foreground">{t("wheelsUnit")}</span>
          </span>
        </div>
        <div className="px-2 py-1.5 text-sm focus-visible:border hover:font-bold whitespace-nowrap">
          <Link
            className="flex items-center gap-2 rounded-[15px]"
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            role="menuitem"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(false);
              }
            }}>
            <User
              className="shrink-0 h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />{" "}
            <span className="inline-block min-w-24 sm:min-w-32 text-sm sm:text-base">{t("profile")}</span>
          </Link>
        </div>
        <div className="px-2 py-1.5 text-sm focus-visible:border hover:font-bold whitespace-nowrap">
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            role="menuitem"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(false);
                logout();
              }
            }}
            className="flex items-center gap-2 cursor-pointer rounded-[15px] w-full text-left">
            <LogOut
              className="shrink-0 h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />{" "}
            <span className="inline-block min-w-24 sm:min-w-32 text-sm sm:text-base">{t("logout")}</span>
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
