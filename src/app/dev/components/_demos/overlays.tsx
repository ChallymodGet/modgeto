"use client";

import {
  Archive,
  Copy,
  Eye,
  FileText,
  Info,
  LogOut,
  MoreHorizontal,
  Pencil,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShowcaseSection, Specimen } from "./section";

export function OverlaysDemo() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <ShowcaseSection
      id="overlays"
      title="Overlays and menus"
      description="Dialogs are centred from tablet and slide up as a bottom sheet on phones. Sheets are side panels from tablet and full screen on phones. All trap focus, close with Escape and return focus."
    >
      <Specimen label="Dialog, sheet and drawer" className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger render={<Button variant="destructive-outline">Decline Request</Button>} />
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Decline this Request?</DialogTitle>
              <DialogDescription>
                Kemi will be told the Request was declined. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <FormField label="Reason for the Client" optional>
                <Textarea placeholder="Share a short reason" maxLength={500} />
              </FormField>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="secondary">Keep Request</Button>} />
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    onClick={() => toast("Request declined. Kemi has been told.")}
                  >
                    Decline Request
                  </Button>
                }
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger render={<Button variant="secondary">View Brief</Button>} />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Project Brief</SheetTitle>
              <SheetDescription>Submitted by Kemi Adeyemi on 9 November 2026.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              {[
                ["Business name", "Bloom & Co"],
                ["About the business", "A florist delivering same-day arrangements across Lagos."],
                ["Stage", "Launching"],
                ["Logo directions", "Wordmark, Abstract mark"],
                ["Why these directions", "Clean, confident and easy to recognise at small sizes."],
              ].map(([q, a]) => (
                <div
                  key={q}
                  className="flex flex-col gap-1 border-b border-border pb-4 last:border-0"
                >
                  <p className="text-label text-foreground-muted">{q}</p>
                  <p className="text-body text-foreground">{a}</p>
                </div>
              ))}
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="secondary">Close</Button>} />
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Drawer>
          <DrawerTrigger render={<Button variant="secondary">More (bottom drawer)</Button>} />
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>More</DrawerTitle>
              <DrawerDescription>Swipe down or press Escape to close.</DrawerDescription>
            </DrawerHeader>
            <nav aria-label="More" className="flex flex-col p-3">
              {[
                [User, "Profile"],
                [FileText, "Subscription"],
                [Settings, "Settings"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof User;
                return (
                  <a
                    key={label as string}
                    href="#overlays"
                    className="flex min-h-12 items-center gap-3 rounded-md px-3 text-body text-foreground hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    <I aria-hidden="true" className="size-5 text-foreground-muted" />
                    {label as string}
                  </a>
                );
              })}
            </nav>
          </DrawerContent>
        </Drawer>
      </Specimen>

      <Specimen
        label="Menus, popover, tooltip, command and toast"
        className="flex flex-wrap items-center gap-3"
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton label="Service actions" icon={<MoreHorizontal />} variant="secondary" />
            }
          />
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Brand identity</DropdownMenuLabel>
              <DropdownMenuItem>
                <Pencil aria-hidden="true" />
                Edit Service
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye aria-hidden="true" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Link copied")}>
                <Copy aria-hidden="true" />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Archive aria-hidden="true" />
              Archive Service
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger render={<Button variant="secondary">What&apos;s a commitment?</Button>} />
          <PopoverContent>
            <p className="text-label">Commitment payment</p>
            <p className="text-body-sm text-foreground-secondary">
              Part of the price paid upfront, directly to the Creative, before the Project starts.
              Modgeto does not collect Client Project payments.
            </p>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger
            render={<IconButton label="About pricing" icon={<Info />} variant="ghost" />}
          />
          <TooltipContent>
            Starting From prices can change after the Creative reviews your Brief.
          </TooltipContent>
        </Tooltip>

        <Button variant="secondary" onClick={() => setCommandOpen(true)}>
          Search Creatives
        </Button>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title="Search Creatives">
          <CommandInput placeholder="Search by name or username" />
          <CommandList>
            <CommandEmpty>No Creatives match that search.</CommandEmpty>
            <CommandGroup heading="Creatives">
              {["Ada Okafor", "Tunde Bakare", "Mira Hassan", "Sola Adebayo"].map((n) => (
                <CommandItem key={n} onSelect={() => setCommandOpen(false)}>
                  <User aria-hidden="true" />
                  {n}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Request submitted", {
              description: "Ada will review your Brief. We'll email you when there's an update.",
            })
          }
        >
          Show toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error("Couldn't save", { description: "Check your connection and try again." })
          }
        >
          Error toast
        </Button>
        <Button variant="ghost" onClick={() => toast("Signed out")}>
          <LogOut aria-hidden="true" />
          Neutral toast
        </Button>
      </Specimen>
    </ShowcaseSection>
  );
}
