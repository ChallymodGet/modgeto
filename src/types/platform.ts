/** Notifications, assets, audit and admin records (docs/03 §62–69, D-019, D-025). */
import type { ID, Timestamp } from "./identity";

export type NotificationEntity = "REQUEST" | "PROJECT" | "SERVICE" | "SUBSCRIPTION";

/** In-app notification (NOT-001). Email delivery is tracked separately and never blocks the action. */
export type Notification = {
  id: ID;
  userId: ID;
  /** Domain event name, e.g. "RequestSubmitted". */
  type: string;
  entityType: NotificationEntity;
  entityId: ID;
  title: string;
  body: string;
  href: string;
  readAt: Timestamp | null;
  createdAt: Timestamp;
};

export type AssetVisibility = "PUBLIC" | "PRIVATE";
export type AssetCategory =
  | "PROFILE_IMAGE"
  | "SERVICE_COVER"
  | "WORK_SAMPLE"
  | "BRIEF_VISUAL_EXAMPLE"
  | "CLIENT_BRIEF_UPLOAD"
  | "PAYMENT_EVIDENCE"
  | "CLARIFICATION_ATTACHMENT";
/** Private files are scanned before they can be downloaded (D-018). */
export type AssetSecurityStatus = "PENDING_SCAN" | "CLEAN" | "BLOCKED";

/** Metadata for a file stored in Cloudflare R2 (docs/03 §65). */
export type Asset = {
  id: ID;
  ownerUserId: ID;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  visibility: AssetVisibility;
  category: AssetCategory;
  securityStatus: AssetSecurityStatus;
  createdAt: Timestamp;
};

/** Admins live in a server-managed table; there is no UI path to become one (D-019). */
export type AdminUser = { userId: ID; createdAt: Timestamp };

/** Append-only (docs/03 §69, NFR-007). */
export type AuditEvent = {
  id: ID;
  actorUserId: ID | null;
  actorRole: "CREATIVE" | "CLIENT" | "ADMIN" | "SYSTEM";
  action: string;
  entityType: string;
  entityId: ID;
  previousState: string | null;
  newState: string | null;
  reason: string | null;
  occurredAt: Timestamp;
};
