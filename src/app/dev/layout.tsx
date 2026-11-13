import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Component showcase",
  robots: { index: false, follow: false },
};

/**
 * Internal development routes (CLAUDE.md §19). Not found in production unless
 * ENABLE_DEV_ROUTES=true is set, for example on a protected preview.
 */
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_ROUTES !== "true") {
    notFound();
  }
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
