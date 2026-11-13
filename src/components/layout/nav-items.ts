/**
 * Workspace navigation (docs/04 §7, §19, §25, §36, §39; D-031; D-039).
 * Kept in one place so desktop and mobile navigation never drift apart.
 */
import {
  ArrowLeftRight,
  Briefcase,
  CreditCard,
  Home,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Package,
  ScrollText,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only the exact path counts as current (workspace home pages). */
  exact?: boolean;
};

export const CREATIVE_HOME = "/app/creative";
export const CLIENT_HOME = "/app/client";
export const ADMIN_HOME = "/admin";
export const HELP_HREF = "mailto:modgetdesigns@gmail.com?subject=Modgeto%20help";

/** Desktop top bar. Settings sits apart as a utility (docs/04 §7). */
export const creativeNav: NavItem[] = [
  { href: CREATIVE_HOME, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: `${CREATIVE_HOME}/requests`, label: "Requests", icon: Inbox },
  { href: `${CREATIVE_HOME}/services`, label: "Services", icon: Package },
  { href: `${CREATIVE_HOME}/projects`, label: "Projects", icon: Briefcase },
  { href: `${CREATIVE_HOME}/profile`, label: "Public Profile", icon: UserRound },
  { href: `${CREATIVE_HOME}/subscription`, label: "Subscription", icon: CreditCard },
];

export const creativeSettings: NavItem = {
  href: `${CREATIVE_HOME}/settings`,
  label: "Settings",
  icon: Settings,
};

/** Tablet and phone bottom bar: Home, Requests, Services, Projects, More (docs/04 §36). */
export const creativeBottomNav: NavItem[] = [
  { ...creativeNav[0], label: "Home", icon: Home },
  creativeNav[1],
  creativeNav[2],
  creativeNav[3],
];

export const creativeMoreNav: NavItem[] = [
  creativeNav[4],
  creativeNav[5],
  creativeSettings,
  { href: CLIENT_HOME, label: "Switch to Client", icon: ArrowLeftRight },
  { href: HELP_HREF, label: "Help", icon: LifeBuoy },
];

/** Desktop and tablet top bar (docs/04 §19). Account lives in the account menu. */
export const clientNav: NavItem[] = [
  { href: CLIENT_HOME, label: "Home", icon: Home, exact: true },
  { href: `${CLIENT_HOME}/requests`, label: "Requests", icon: Inbox },
  { href: `${CLIENT_HOME}/projects`, label: "Projects", icon: Briefcase },
];

/** Phone bottom bar (docs/04 §39). */
export const clientBottomNav: NavItem[] = [
  ...clientNav,
  { href: `${CLIENT_HOME}/account`, label: "Account", icon: UserRound },
];

export const adminNav: NavItem[] = [
  { href: ADMIN_HOME, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: `${ADMIN_HOME}/users`, label: "Users", icon: Users },
  { href: `${ADMIN_HOME}/services`, label: "Services", icon: Package },
  { href: `${ADMIN_HOME}/requests`, label: "Requests", icon: Inbox },
  { href: `${ADMIN_HOME}/projects`, label: "Projects", icon: Briefcase },
  { href: `${ADMIN_HOME}/subscriptions`, label: "Subscriptions", icon: CreditCard },
  { href: `${ADMIN_HOME}/moderation`, label: "Moderation", icon: ShieldAlert },
  { href: `${ADMIN_HOME}/audit`, label: "Audit", icon: ScrollText },
  { href: `${ADMIN_HOME}/settings`, label: "Platform Settings", icon: Settings },
];

export function isActive(pathname: string, item: Pick<NavItem, "href" | "exact">) {
  if (item.href.startsWith("mailto:")) return false;
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Navigation sets by workspace. Server components pass the key, and client
 * components look up the items, because icon components can't cross the
 * server/client boundary as props.
 */
export const navSets = {
  creative: { top: creativeNav, bottom: creativeBottomNav, more: creativeMoreNav },
  client: { top: clientNav, bottom: clientBottomNav, more: undefined },
} satisfies Record<string, { top: NavItem[]; bottom: NavItem[]; more?: NavItem[] }>;

export type NavSet = keyof typeof navSets;
