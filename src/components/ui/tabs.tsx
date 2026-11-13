"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
import { createContext, useContext } from "react";

/**
 * Tabs switch views within one page (arrow keys move between tabs). For
 * navigation between pages use `SectionNavigation`, which renders links.
 *
 * - `segmented`: pill group in the D-031 style, for 2–4 short options.
 * - `line`: underlined tabs that scroll sideways on narrow screens.
 */
type Variant = "segmented" | "line";
const VariantContext = createContext<Variant>("segmented");

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-4", className)} {...props} />;
}

type TabsListProps = TabsPrimitive.List.Props & { variant?: Variant };

function TabsList({ className, variant = "segmented", children, ...props }: TabsListProps) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.List
        className={cn(
          "relative flex max-w-full",
          variant === "segmented"
            ? "w-fit gap-1 rounded-full bg-surface-subtle p-1"
            : "[scrollbar-width:none] gap-6 overflow-x-auto border-b border-border",
          className,
        )}
        {...props}
      >
        {children}
        {variant === "line" && (
          <TabsPrimitive.Indicator className="absolute bottom-0 left-(--active-tab-left) h-0.5 w-(--active-tab-width) bg-primary transition-[left,width] duration-200 ease-out-soft motion-reduce:transition-none" />
        )}
      </TabsPrimitive.List>
    </VariantContext.Provider>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const variant = useContext(VariantContext);
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 text-label whitespace-nowrap text-foreground-secondary outline-none select-none",
        "transition-colors duration-150 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "data-disabled:pointer-events-none data-disabled:text-foreground-disabled",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        variant === "segmented"
          ? "h-10 rounded-full px-4 md:h-8 data-active:bg-surface data-active:font-semibold data-active:text-foreground data-active:shadow-sm"
          : "h-11 data-active:font-semibold data-active:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        "rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
