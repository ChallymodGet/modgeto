import NextLink from "next/link";
import { ActionsDemo } from "./_demos/actions";
import { DisplayDemo } from "./_demos/display";
import { FormsDemo } from "./_demos/forms";
import { NavigationDemo } from "./_demos/navigation";
import { OverlaysDemo } from "./_demos/overlays";
import { SelectionDemo } from "./_demos/selection";

const contents = [
  ["actions", "Buttons and links"],
  ["forms", "Form fields"],
  ["selection", "Selection cards"],
  ["status", "Badges and status"],
  ["avatars-cards", "Avatars and cards"],
  ["navigation", "Tabs and navigation"],
  ["overlays", "Overlays and menus"],
  ["feedback", "Loading, empty and error"],
] as const;

/** Component showcase (CLAUDE.md §19, docs/07 §45). Product components join in Phase 6. */
export default function ComponentsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 md:px-8">
          <p className="text-caption font-medium tracking-wide text-primary-text uppercase">
            Internal
          </p>
          <h1 className="text-h1 text-foreground">Component showcase</h1>
          <p className="max-w-2xl text-body text-foreground-secondary">
            Generic UI primitives on Base UI, themed with the Modgeto tokens. Check every component
            at phone, tablet and desktop widths, with the keyboard only.
          </p>
          <NextLink
            href="/dev/components/product"
            className="w-fit text-label text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Product components →
          </NextLink>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 md:px-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Showcase contents" className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <ul className="relative flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1">
            {contents.map(([id, label]) => (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  className="flex h-10 items-center rounded-full border border-border bg-surface px-4 text-label whitespace-nowrap text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:rounded-md lg:border-0 lg:bg-transparent lg:px-3"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex min-w-0 flex-col gap-16">
          <ActionsDemo />
          <FormsDemo />
          <SelectionDemo />
          <DisplayDemo />
          <NavigationDemo />
          <OverlaysDemo />
        </main>
      </div>
    </div>
  );
}
