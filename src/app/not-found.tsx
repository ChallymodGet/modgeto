import type { Metadata } from "next";
import NextLink from "next/link";
import { NotFoundScreen } from "@/components/layout/state-screens";
import { Wordmark } from "@/components/layout/wordmark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center px-4 md:px-6 lg:px-8">
        <NextLink
          href="/"
          aria-label="Modgeto home"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <Wordmark />
        </NextLink>
      </header>
      <main id="main" className="flex-1">
        <h1 className="sr-only">Page not found</h1>
        <NotFoundScreen />
      </main>
    </div>
  );
}
