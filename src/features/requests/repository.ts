import type { Request, RequestDetail } from "@/types";

export interface RequestRepository {
  /** Newest first. */
  listForCreative(creativeId: string): Promise<Request[]>;
  /** Newest first. */
  listForClient(clientId: string): Promise<Request[]>;
  getDetail(requestId: string): Promise<RequestDetail | null>;
}
