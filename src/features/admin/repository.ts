import type { AuditEvent, Request, Service, Subscription, User } from "@/types";

/** Read-only operational views; Admins never act for participants (docs/04 §29). */
export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>;
  listUsers(): Promise<User[]>;
  listServices(): Promise<Service[]>;
  listRequests(): Promise<Request[]>;
  listSubscriptions(): Promise<Subscription[]>;
  /** Newest first. */
  listAuditEvents(): Promise<AuditEvent[]>;
}
