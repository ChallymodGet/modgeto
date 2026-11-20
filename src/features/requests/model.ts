/**
 * Request read-model helpers (D-027): who owes a reply is derived from the
 * RequestResponses, never stored as a status.
 */
import type { RequestView } from "@/lib/domain";
import type { RequestDetail } from "@/types";

/**
 * True when the Client wrote last during negotiation and the Creative hasn't
 * replied. A proposal sent after the Client's message counts as a reply.
 */
export function clientAwaitingReply(
  detail: Pick<RequestDetail, "request" | "responses"> & Partial<Pick<RequestDetail, "proposals">>,
): boolean {
  const { status } = detail.request;
  if (status !== "SUBMITTED" && status !== "AWAITING_CLIENT") return false;
  const latest = [...detail.responses]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);
  if (latest?.authorRole !== "CLIENT") return false;
  return !(detail.proposals ?? []).some((p) => p.createdAt > latest.createdAt);
}

/** Everything the status-language functions need (lib/domain/status). */
export function requestView(
  detail: Pick<RequestDetail, "request" | "responses"> & Partial<Pick<RequestDetail, "proposals">>,
): RequestView {
  return {
    status: detail.request.status,
    awaitingClientReason: detail.request.awaitingClientReason,
    clientAwaitingReply: clientAwaitingReply(detail),
  };
}

export type HistoryEntry = { at: string; text: string };

/**
 * The Request's history, newest first, derived from its records so it can't
 * drift from them (docs/04 §10). Wording is for the given viewer.
 */
export function requestHistory(
  detail: RequestDetail,
  names: { CREATIVE: string; CLIENT: string },
  viewer: "CREATIVE" | "CLIENT",
): HistoryEntry[] {
  const you = (role: "CREATIVE" | "CLIENT") => (role === viewer ? "You" : names[role]);
  const { request: r } = detail;
  const out: HistoryEntry[] = [
    { at: r.submittedAt, text: `${you("CLIENT")} submitted the Request` },
  ];

  for (const p of detail.proposals) {
    const what = p.kind === "QUOTE" ? "a quote" : "changes";
    out.push({ at: p.createdAt, text: `${you("CREATIVE")} sent ${what} (version ${p.version})` });
    if (p.respondedAt && (p.status === "ACCEPTED" || p.status === "REJECTED")) {
      out.push({
        at: p.respondedAt,
        text: `${you("CLIENT")} ${p.status === "ACCEPTED" ? "accepted" : "turned down"} version ${p.version}`,
      });
    }
  }
  for (const resp of detail.responses) {
    if (resp.type === "CREATIVE_CLARIFICATION")
      out.push({ at: resp.createdAt, text: `${you("CREATIVE")} asked a question` });
    if (resp.type === "CLIENT_CLARIFICATION")
      out.push({ at: resp.createdAt, text: `${you("CLIENT")} replied` });
  }
  if (detail.agreement && !detail.agreement.proposalId) {
    out.push({ at: detail.agreement.agreedAt, text: `${you("CREATIVE")} accepted the Request` });
  }
  for (const t of detail.termsAcceptances) {
    if (t.kind === "FINAL")
      out.push({ at: t.acceptedAt, text: `${you("CLIENT")} accepted the final terms` });
  }
  for (const d of detail.declarations) {
    out.push({
      at: d.declaredAt,
      text: `${you("CLIENT")} said they paid by ${d.paymentMethod.label}`,
    });
    if (d.resolution === "NOT_RECEIVED" && d.resolvedAt) {
      out.push({
        at: d.resolvedAt,
        text: `${you("CREATIVE")} marked a payment as not received yet`,
      });
    }
  }
  for (const c of detail.confirmations) {
    out.push({ at: c.confirmedAt, text: `${you("CREATIVE")} confirmed a payment received` });
  }
  for (const a of detail.adjustments) {
    out.push({
      at: a.createdAt,
      text: `${you("CREATIVE")} corrected a confirmed payment: ${a.reason}`,
    });
  }
  if (r.closedAt) {
    const closed: Partial<Record<typeof r.status, string>> = {
      DECLINED: `${you("CREATIVE")} declined the Request`,
      WITHDRAWN: `${you("CLIENT")} withdrew the Request`,
      CONVERTED_TO_PROJECT: `${you("CREATIVE")} started the Project`,
    };
    if (closed[r.status]) out.push({ at: r.closedAt, text: closed[r.status]! });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
