import {
  Briefcase,
  ChartBar,
  Coins,
  CreditCard,
  Dices,
  Heart,
  Key,
  LayoutDashboard,
  Map,
  Tag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type NavLinkItem = {
  label: string;
  icon: LucideIcon;
  type: "link";
  href: string;
  external?: boolean;
};

type NavFolderItem = {
  label: string;
  icon: LucideIcon;
  type: "folder";
  children: NavLinkItem[];
};

export type NavItem = NavLinkItem | NavFolderItem;

const keycloakAdminUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ADMIN_URL?.trim();
const stripeDashboardUrl = process.env.NEXT_PUBLIC_STRIPE_DASHBOARD_URL?.trim();
const graphanaDashboardUrl = process.env.NEXT_PUBLIC_GRAPHANA_DASHBOARD_URL?.trim();

function externalNavItem(href: string | undefined, label: string, icon: LucideIcon): NavLinkItem | null {
  if (!href) return null;
  return { href, label, icon, type: "link", external: true };
}

const externalNavItems = [
  externalNavItem(keycloakAdminUrl, "Keycloak", Key),
  externalNavItem(stripeDashboardUrl, "Stripe", Wallet),
  externalNavItem(graphanaDashboardUrl, "Graphana", ChartBar),
].filter((item): item is NavLinkItem => item !== null);

export const navItems: NavItem[] = [
  {
    label: "Business",
    icon: Briefcase,
    type: "folder",
    children: [
      { href: "/business", label: "Dashboard", icon: LayoutDashboard, type: "link" },
      { href: "/business/adventure", label: "Adventure", icon: Map, type: "link" },
      { href: "/business/session", label: "Session", icon: Dices, type: "link" },
      { href: "/business/payment", label: "Paiement", icon: Coins, type: "link" },
    ],
  },
  {
    label: "Paiement",
    icon: CreditCard,
    type: "folder",
    children: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, type: "link" },
      { href: "/promo-codes", label: "Codes promo", icon: Tag, type: "link" },
      { href: "/affiliations", label: "Affiliations", icon: Users, type: "link" },
      { href: "/referrals", label: "Parrainage", icon: Heart, type: "link" },
      { href: "/payments", label: "Paiements", icon: CreditCard, type: "link" },
    ],
  },
  ...externalNavItems,
];

export function isNavHrefActive(href: string, pathname: string): boolean {
  if (href === "/" || href === "/business") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}
