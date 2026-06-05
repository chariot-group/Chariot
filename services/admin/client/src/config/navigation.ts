import {
  CreditCard,
  Heart,
  Key,
  LayoutDashboard,
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

const externalNavItems: NavLinkItem[] = [
  keycloakAdminUrl && {
    href: keycloakAdminUrl,
    label: "Keycloak",
    icon: Key,
    type: "link",
    external: true,
  },
  stripeDashboardUrl && {
    href: stripeDashboardUrl,
    label: "Stripe",
    icon: Wallet,
    type: "link",
    external: true,
  },
].filter((item): item is NavLinkItem => Boolean(item));

export const navItems: NavItem[] = [
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
