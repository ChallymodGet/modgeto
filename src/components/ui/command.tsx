"use client";

import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

/** Searchable list (cmdk): combobox semantics, arrow keys and Enter. */
function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex size-full flex-col overflow-hidden bg-surface-elevated text-foreground",
        className,
      )}
      {...props}
    />
  );
}

type CommandDialogProps = ComponentProps<typeof Dialog> & {
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** Command list in a dialog. The title is visually hidden but names the dialog. */
function CommandDialog({ title, description, children, ...props }: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent size="md" showCloseButton={false} className="overflow-hidden sm:top-[30%]">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description && <DialogDescription className="sr-only">{description}</DialogDescription>}
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4">
      <Search aria-hidden="true" className="size-4 shrink-0 text-foreground-muted" />
      <CommandPrimitive.Input
        className={cn(
          "h-12 w-full bg-transparent text-base outline-none placeholder:text-foreground-muted md:text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-80 overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("px-4 py-8 text-center text-body-sm text-foreground-muted", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "p-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-muted",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-body-sm outline-none select-none md:min-h-9",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:text-foreground-disabled data-[selected=true]:bg-surface-subtle",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground-muted",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
