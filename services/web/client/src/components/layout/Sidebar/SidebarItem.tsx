"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export default function SidebarItem({ href, icon: Icon, label }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname.endsWith(href) || pathname.startsWith(href + "/");

  console.log({ pathname, href, isActive });

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
      aria-current={isActive ? "page" : undefined}>
      <Icon
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}
