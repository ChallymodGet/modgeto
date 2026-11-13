import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

/** Decorative spinner. Pair it with text or `aria-busy` so the state is announced. */
function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-4 animate-spin motion-reduce:animate-none", className)}
    />
  );
}

export { Spinner };
