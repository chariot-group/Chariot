"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tag, Users, CreditCard, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/promo-codes", label: "Codes promo", icon: Tag },
  { href: "/affiliations", label: "Affiliations", icon: Users },
  { href: "/payments", label: "Paiements", icon: CreditCard },
  { href: "/referrals", label: "Parrainage", icon: Heart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full w-56 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground leading-none">Chariot</p>
            <p className="text-xs text-muted-foreground">Paiements Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-card-foreground"
                    : "text-muted-foreground hover:bg-muted/20 hover:text-card-foreground",
                )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
