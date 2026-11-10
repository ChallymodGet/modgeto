"use client";

import { Check, Clock, FileText, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * Illustrative, looping product preview. Steps:
 * 0 storefront · 1 Service chosen · 2 package · 3 add-on · 4 Brief · 5 Request sent
 * Reduced motion shows the finished state without cycling.
 */
const LAST_STEP = 5;
const STEP_MS = 1900;

const services = [
  { name: "Brand Identity", price: "₦450,000", note: "Fixed price", meta: "3 weeks" },
  { name: "Landing Page Design", price: "From ₦300,000", note: "Starting from", meta: "2 weeks" },
  { name: "Design Retainer", price: "Request a quote", note: "Custom quote", meta: "Monthly" },
];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function HeroPreview() {
  const [cycleStep, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
  const step = reducedMotion ? LAST_STEP : cycleStep;

  useEffect(() => {
    if (reducedMotion) return;

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (ref.current) observer.observe(ref.current);

    const id = window.setInterval(() => {
      if (!visible || document.hidden) return;
      setStep((s) => (s >= LAST_STEP ? 0 : s + 1));
    }, STEP_MS);

    return () => {
      window.clearInterval(id);
      observer.disconnect();
    };
  }, [reducedMotion]);

  const configuring = step >= 1;
  const packageChosen = step >= 2;
  const addOn = step >= 3;
  const briefDone = step >= 4;
  const sent = step >= 5;

  return (
    <figure ref={ref} className="relative mx-auto w-full max-w-[1040px] text-left">
      <figcaption className="sr-only">
        Preview: a Client opens a Creative&apos;s Modgeto link, chooses the Brand Identity Service,
        selects a package and an add-on, completes the Project Brief and sends a Project Request.
      </figcaption>

      <div aria-hidden className="relative">
        {/* Browser frame with the public storefront */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-3 border-b border-border bg-surface-subtle/60 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </div>
            <div className="mx-auto flex min-w-0 items-center gap-1 rounded-full border border-border bg-surface px-4 py-1.5 text-caption text-foreground-muted sm:text-body-sm">
              <span>modgeto.com/</span>
              <span className="font-medium text-foreground">ada</span>
              <span className="mg-caret ml-px inline-block h-4 w-px bg-primary" />
            </div>
            <div className="w-10" />
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:gap-8 lg:pr-[352px]">
            {/* Creative identity */}
            <div>
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-secondary-500 text-h4 text-white">
                  AO
                </div>
                <div>
                  <p className="text-h4 text-foreground">Ada Okafor</p>
                  <p className="text-body-sm text-foreground-muted">Brand and UI Designer · Lagos</p>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-success-border bg-success-subtle px-3 py-1 text-caption font-medium text-success">
                <span className="mg-pulse size-1.5 rounded-full bg-success" />
                Available for new Projects
              </p>
              <p className="mt-4 text-body-sm text-foreground-secondary">
                I help early-stage brands look as good as the work behind them.
              </p>
            </div>

            {/* Services */}
            <ul className="grid gap-3">
              {services.map((s, i) => {
                const active = configuring && i === 0;
                return (
                  <li
                    key={s.name}
                    className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-all duration-500 ${
                      active
                        ? "border-primary bg-primary-subtle shadow-[0_0_0_3px_var(--primary-subtle)]"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-label text-foreground">{s.name}</p>
                      <p className="text-caption text-foreground-muted">
                        {s.note} · {s.meta}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-body-sm ${
                        i === 2 ? "text-foreground-muted" : "font-medium text-foreground"
                      }`}
                    >
                      {s.price}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Configuration panel: stacked on mobile, floating on desktop */}
        <div
          className={`relative mx-auto mt-4 w-full max-w-[380px] rounded-xl border border-border bg-surface-elevated p-5 shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)] transition-all duration-700 ease-out-soft lg:absolute lg:-right-10 lg:-bottom-14 lg:mt-0 ${
            configuring ? "lg:translate-y-0 lg:opacity-100" : "lg:translate-y-4 lg:opacity-0"
          }`}
        >
          <p className="text-caption text-foreground-muted">Configure</p>
          <p className="text-h4 text-foreground">Brand Identity</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {["Essential", "Standard"].map((p) => {
              const selected = packageChosen && p === "Standard";
              return (
                <div
                  key={p}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-body-sm transition-colors duration-300 ${
                    selected
                      ? "border-primary bg-primary-subtle text-foreground"
                      : "border-border text-foreground-secondary"
                  }`}
                >
                  {p}
                  {selected && <Check className="size-4 text-primary-text" />}
                </div>
              );
            })}
          </div>

          <div
            className={`mt-2 flex items-center justify-between rounded-md border px-3 py-2 text-body-sm transition-colors duration-300 ${
              addOn ? "border-primary bg-primary-subtle" : "border-border"
            }`}
          >
            <span className="flex items-center gap-2 text-foreground-secondary">
              <span
                className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${
                  addOn ? "border-primary bg-primary text-white" : "border-border-strong"
                }`}
              >
                {addOn && <Check className="size-3" strokeWidth={3} />}
              </span>
              Brand guidelines
            </span>
            <span className="text-foreground-muted">+₦80,000</span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-caption text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" /> Project Brief
              </span>
              <span>{briefDone ? "4 of 4 sections" : "1 of 4 sections"}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out-soft"
                style={{ width: briefDone ? "100%" : packageChosen ? "25%" : "0%" }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="text-caption text-foreground-muted">Project total</p>
              <p className="text-numeral text-[1.75rem] leading-none text-foreground">
                {addOn ? "₦530,000" : "₦450,000"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-caption text-foreground-muted">
              <Clock className="size-3.5" /> 3 weeks
              <RotateCcw className="ml-2 size-3.5" /> 2 revisions
            </div>
          </div>

          {/* Sent state */}
          <div
            className={`absolute inset-x-5 top-full mt-3 flex items-center gap-3 rounded-lg border border-success-border bg-surface px-4 py-3 shadow-md transition-all duration-500 ${
              sent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-success-subtle text-success">
              <Send className="size-4" />
            </span>
            <div>
              <p className="text-label text-foreground">Project Request sent</p>
              <p className="text-caption text-foreground-muted">Ada reviews it next.</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
