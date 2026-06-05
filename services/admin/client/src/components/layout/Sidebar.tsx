"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { useSidebar } from "@/providers/SidebarContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

function NavLink({
  href,
  label,
  icon: Icon,
  external,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  const className = cn(
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-primary/15 text-card-foreground"
      : "text-muted-foreground hover:bg-muted/20 hover:text-card-foreground",
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        aria-label={`${label} (ouvre un nouvel onglet)`}
        className={className}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

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
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground leading-none">Chariot</p>
            <p className="text-xs text-muted-foreground">Gestion Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Accordion
            type="single"
            className="flex flex-col gap-1 p-3 flex-1"
            collapsible>
            {navItems.map((item) => {
              if (item.type === "link") {
                const active = !item.external && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    external={item.external}
                    active={active}
                    onNavigate={close}
                  />
                );
              }

              return (
                <AccordionItem
                  className="border-none hover:bg-muted/20 hover:text-card-foreground cursor-pointer rounded-lg px-3"
                  value={item.label}
                  key={item.label}>
                  <AccordionTrigger>
                    <div className="flex gap-3 text-sm font-medium text-muted-foreground cursor-pointer">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {item.children.map((child) => {
                      const active = child.href === "/" ? pathname === "/" : pathname.startsWith(child.href);
                      return (
                        <NavLink
                          key={child.href}
                          href={child.href}
                          label={child.label}
                          icon={child.icon}
                          active={active}
                          onNavigate={close}
                        />
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </nav>
      </aside>
    </>
  );
}
