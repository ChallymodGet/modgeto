/**
 * Request read-model helpers (D-027): who owes a reply is derived from the
 * RequestResponses, never stored as a status.
 */
import type { RequestView } from "@/lib/domain";
import type { RequestDetail } from "@/types";

/** True when the Client wrote last during negotiation and the Creative hasn't replied. */
export function clientAwaitingReply(detail: Pick<RequestDetail, "request" | "responses">): boolean {
  const { status } = detail.request;
  if (status !== "SUBMITTED" && status !== "AWAITING_CLIENT") return false;
  const latest = [...detail.responses]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);
  return latest?.authorRole === "CLIENT";
}

/** Everything the status-language functions need (lib/domain/status). */
export function requestView(detail: Pick<RequestDetail, "request" | "responses">): RequestView {
  return {
    status: detail.request.status,
    awaitingClientReason: detail.request.awaitingClientReason,
    clientAwaitingReply: clientAwaitingReply(detail),
  };
}
