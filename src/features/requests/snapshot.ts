/**
 * Request snapshots (SRV-008, BRF-008, TRM-004, D-009): the Service, scope,
 * Brief, price, terms and commitment exactly as the Client submitted them.
 * Pure, so the Review screen can preview them and the submit action
 * (Phase 8) can store them unchanged.
 */
import {
  type Answers,
  type Result,
  type Selection,
  calculatePrice,
  err,
  ok,
  validateBriefAnswers,
  visibleQuestions,
} from "@/lib/domain";
import { serviceCommitmentBps, toPricingConfig } from "@/features/services/model";
import type { CreativeProfile, RequestSnapshot, ScopeSnapshot, Service } from "@/types";

/** The scope a selection describes: package, deliverables, timeline and revisions. */
export function buildScope(service: Service, selection: Selection): ScopeSnapshot {
  const pkg = service.packages.find((p) => p.id === selection.packageId) ?? null;
  const standard = service.deliveryOptions.find((d) => d.isStandard) ?? null;
  const delivery =
    service.deliveryOptions.find((d) => d.id === selection.deliveryOptionId) ?? standard;
  const turnaround = (delivery && !delivery.isStandard ? delivery.turnaround : pkg?.turnaround) ??
    delivery?.turnaround ??
    pkg?.turnaround ?? { value: 1, unit: "WEEKS" };
  return {
    selection,
    packageName: pkg?.name ?? null,
    deliverables: service.deliverables
      .filter((d) => d.packageId === null || d.packageId === pkg?.id)
      .map((d) => ({ name: d.name, description: d.description })),
    turnaround,
    revisions: pkg?.revisions ?? service.revisions.policy,
  };
}

/** The full submission snapshot, or the first reason it can't be built yet. */
export function buildRequestSnapshot(
  service: Service,
  creative: CreativeProfile,
  selection: Selection,
  answers: Answers,
): Result<RequestSnapshot> {
  const briefIssues = validateBriefAnswers(service.brief, answers);
  if (briefIssues.length > 0)
    return err("BRIEF_INCOMPLETE", "Complete the required Brief questions.", briefIssues[0].target);
  const bps = serviceCommitmentBps(service, creative);
  const price = calculatePrice(toPricingConfig(service), selection, bps);
  if (!price.ok) return price;
  return ok({
    service: {
      serviceId: service.id,
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      pricingMode: service.pricingMode,
      currency: service.currency,
      creative: {
        userId: creative.userId,
        username: creative.username,
        displayName: creative.displayName,
        professionalTitle: creative.professionalTitle,
      },
    },
    scope: buildScope(service, selection),
    brief: {
      brief: service.brief,
      answers,
      visibleQuestionIds: visibleQuestions(service.brief, answers).map((q) => q.id),
    },
    price: price.value,
    terms: { content: service.terms.content, version: service.terms.version },
    commitment: {
      bps: price.value.commitment ? bps : null,
      amountMinor: price.value.commitment?.amountMinor ?? null,
    },
  });
}
