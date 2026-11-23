/**
 * Client Home read model (docs/04 §20). "Needs your attention" lists each
 * Request where the Client has the next move, in the docs/04 §20 order:
 * scope changes, proposal or quote, terms, commitment payment. Pure, so the
 * order and wording are tested.
 */
import { type StatusIntent, formatMoney, isClosed, money } from "@/lib/domain";
import type { RequestDetail } from "@/types";
import { clientAwaitingReply, requestHistory } from "./model";
import { openProposal } from "./request-actions";

export type ClientAttentionKind = "CHANGES" | "QUOTE" | "QUESTION" | "TERMS" | "PAYMENT";

export type ClientAttention = {
  kind: ClientAttentionKind;
  requestId: string;
  title: string;
  description: string;
  action: { href: string; label: string };
  tone: StatusIntent;
};

const ORDER: ClientAttentionKind[] = ["CHANGES", "QUOTE", "QUESTION", "TERMS", "PAYMENT"];
/** Straight to the section where the Client acts, not the top of the Request. */
const SECTION: Record<ClientAttentionKind, string> = {
  CHANGES: "agreement",
  QUOTE: "agreement",
  QUESTION: "clarification",
  TERMS: "terms",
  PAYMENT: "payment",
};
const href = (id: string, kind: ClientAttentionKind) =>
  `/app/client/requests/${id}#${SECTION[kind]}`;

export function clientAttention(
  details: RequestDetail[],
  creativeNames: Record<string, string>,
  today: string,
): ClientAttention[] {
  const items: ClientAttention[] = [];
  for (const d of details) {
    const r = d.request;
    const creative = creativeNames[r.creativeId] ?? "The Creative";
    const name = creative.split(" ")[0];
    const add = (
      kind: ClientAttentionKind,
      title: string,
      description: string,
      label: string,
      tone: StatusIntent = "info",
    ) =>
      items.push({
        kind,
        requestId: r.id,
        title,
        description,
        action: { href: href(r.id, kind), label },
        tone,
      });

    if (r.status === "AWAITING_CLIENT" && r.awaitingClientReason === "CLARIFICATION_REQUESTED") {
      add(
        "QUESTION",
        `${name} has a question`,
        `About ${r.title}. Reply so they can carry on.`,
        "Reply",
      );
      continue;
    }
    const proposal = r.status === "AWAITING_CLIENT" ? openProposal(d) : null;
    // While the Client waits on the Creative's reply to their question, it isn't the Client's move.
    if (proposal && !clientAwaitingReply(d)) {
      const expired = proposal.validUntil !== null && proposal.validUntil < today;
      if (proposal.kind === "QUOTE") {
        add(
          "QUOTE",
          expired ? `${name}'s quote has expired` : `Quote from ${name}`,
          expired
            ? `For ${r.title}. Ask ${name} to renew it before you accept.`
            : `For ${r.title}: ${formatMoney(money(proposal.totalMinor, proposal.currency))}. Review it before you accept.`,
          "Review quote",
          expired ? "warning" : "info",
        );
      } else {
        add(
          "CHANGES",
          `${name} suggested changes`,
          `To ${r.title}. Review what changed before you accept.`,
          "Review changes",
        );
      }
      continue;
    }
    if (r.status === "AWAITING_TERMS") {
      add(
        "TERMS",
        "Terms to accept",
        `For ${r.title}. Accept them to move to the next step.`,
        "Review terms",
      );
      continue;
    }
    if (r.status === "AWAITING_COMMITMENT" || r.status === "PARTIALLY_CONFIRMED") {
      const due = (r.requiredCommitmentMinor ?? 0n) - r.confirmedMinor;
      const lastNotReceived =
        [...d.declarations].sort((a, b) => a.declaredAt.localeCompare(b.declaredAt)).at(-1)
          ?.resolution === "NOT_RECEIVED";
      add(
        "PAYMENT",
        lastNotReceived ? `${name} hasn't received your payment` : "Commitment payment due",
        lastNotReceived
          ? `For ${r.title}. Check the details and send it again, or contact ${name}.`
          : `${formatMoney(money(due > 0n ? due : 0n, r.snapshot.service.currency))} for ${r.title}, paid directly to ${name}.`,
        "See payment details",
        lastNotReceived ? "warning" : "info",
      );
    }
  }
  return items.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

/** Open Requests the Client isn't asked to act on right now. */
export function activeRequests(
  details: RequestDetail[],
  attention: ClientAttention[],
): RequestDetail[] {
  const needs = new Set(attention.map((a) => a.requestId));
  return details.filter((d) => !isClosed(d.request.status) && !needs.has(d.request.id));
}

/** The latest events across all Requests, in the Client's words. */
export function recentActivity(
  details: RequestDetail[],
  creativeNames: Record<string, string>,
  clientName: string,
  limit = 6,
) {
  return details
    .flatMap((d) =>
      requestHistory(
        d,
        { CREATIVE: creativeNames[d.request.creativeId] ?? "The Creative", CLIENT: clientName },
        "CLIENT",
      ).map((h) => ({ ...h, requestId: d.request.id, requestTitle: d.request.title })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
