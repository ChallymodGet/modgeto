import type { Notification } from "@/types";

export interface NotificationRepository {
  /** Newest first. */
  listForUser(userId: string): Promise<Notification[]>;
  unreadCount(userId: string): Promise<number>;
}
