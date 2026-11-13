"use client";

import { ArrowLeftRight, LogOut, Settings, Sparkles, UserRound } from "lucide-react";
import NextLink from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CLIENT_HOME, CREATIVE_HOME } from "./nav-items";

export type Workspace = "creative" | "client" | "admin";

type AccountMenuProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  workspace: Workspace;
  /** Client-only users see "Become a Creative" instead (docs/04 §17). */
  hasCreative: boolean;
};

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <DropdownMenuItem render={<NextLink href={href} />}>{children}</DropdownMenuItem>;
}

/** Account and workspace switching (docs/04 §17). */
export function AccountMenu({ name, email, avatarUrl, workspace, hasCreative }: AccountMenuProps) {
  const accountHref =
    workspace === "client" ? `${CLIENT_HOME}/account` : `${CREATIVE_HOME}/settings`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className={cn(
          "flex size-11 items-center justify-center rounded-full md:size-10",
          "transition-shadow hover:ring-4 hover:ring-surface-subtle",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <Avatar name={name} src={avatarUrl} size="sm" decorative />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-label text-foreground">{name}</span>
            <span className="truncate font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {workspace !== "admin" && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            {hasCreative ? (
              workspace === "creative" ? (
                <MenuLink href={CLIENT_HOME}>
                  <ArrowLeftRight aria-hidden="true" />
                  Switch to Client
                </MenuLink>
              ) : (
                <MenuLink href={CREATIVE_HOME}>
                  <ArrowLeftRight aria-hidden="true" />
                  Switch to Creative
                </MenuLink>
              )
            ) : (
              <MenuLink href="/app/onboarding">
                <Sparkles aria-hidden="true" />
                Become a Creative
              </MenuLink>
            )}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        {workspace !== "admin" && (
          <MenuLink href={accountHref}>
            {workspace === "client" ? (
              <UserRound aria-hidden="true" />
            ) : (
              <Settings aria-hidden="true" />
            )}
            {workspace === "client" ? "Account" : "Settings"}
          </MenuLink>
        )}
        {/* Becomes a sign-out Server Action with Supabase Auth (Phase 9). */}
        <MenuLink href="/auth/sign-in">
          <LogOut aria-hidden="true" />
          Sign out
        </MenuLink>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
