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
        <Avatar className="h-12 w-12 cursor-pointer">
          <AvatarImage
            src={user?.avatar || undefined}
            alt={user?.username ? `${user.username} avatar` : "User avatar"}
          />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      </CollapsibleTrigger>
      <CollapsibleContent
        ref={collapsibleContentRef}
        role="menu"
        aria-label={t("profile")}
        className="min-w-max flex-col bg-card py-1.5 px-3 transition-all duration-100 flex absolute top-14 right-0 text-popover-foreground rounded-2xl border">
        <div className="px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
          <Link
            className="flex items-center gap-2 rounded-2xl"
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
              className="shrink-0"
              aria-hidden="true"
            />{" "}
            <span className="inline-block min-w-32">{t("profile")}</span>
          </Link>
        </div>
        <div className="px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:font-bold whitespace-nowrap">
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
            className="flex items-center gap-2 cursor-pointer rounded-2xl w-full text-left">
            <LogOut
              className="shrink-0"
              aria-hidden="true"
            />{" "}
            <span className="inline-block min-w-32">{t("logout")}</span>
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
