"use client";

/**
 * Copy or share the Creative's link (PUB-008). Native sharing where the
 * device supports it, with Copy My Link as the always-available fallback.
 */
import { Check, Copy, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const subscribe = () => () => {};

export function ShareLink({
  url,
  label = "Copy My Link",
  size = "md",
}: {
  url: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    subscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied", {
        description: "Paste it in your bio, portfolio or email signature.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Start a Project with me", url });
    } catch {
      // Dismissed or unsupported: copying is still available.
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} variant="secondary" onClick={copy}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "Copied" : label}
      </Button>
      {canShare && (
        <Button size={size} variant="ghost" onClick={share}>
          <Share2 aria-hidden="true" />
          Share
        </Button>
      )}
    </div>
  );
}
