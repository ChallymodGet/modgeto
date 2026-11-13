/** In-memory repositories over the fixtures. Replaced by Supabase in Phase 8. */
import * as data from "@/lib/fixtures";
import type { Repositories } from "./index";

/** Callers get copies, so a screen can never mutate shared fixture data. */
const copy = <T>(value: T): T => structuredClone(value);
const newestFirst = <T extends { submittedAt?: string; createdAt?: string; occurredAt?: string }>(
  a: T,
  b: T,
) =>
  (b.submittedAt ?? b.createdAt ?? b.occurredAt ?? "").localeCompare(
    a.submittedAt ?? a.createdAt ?? a.occurredAt ?? "",
  );

const requests = () => data.requestDetails.map((d) => d.request);

export const fixtureRepositories: Repositories = {
  users: {
    async getById(userId) {
      return copy(data.users.find((u) => u.id === userId) ?? null);
    },
  },

  creatives: {
    async getByUsername(username) {
      const normalized = username.trim().toLowerCase();
      return copy(data.creatives.find((c) => c.username === normalized) ?? null);
    },
    async getByUserId(userId) {
      return copy(data.creatives.find((c) => c.userId === userId) ?? null);
    },
    async listPaymentMethods(creativeId) {
      return copy(data.paymentMethods.filter((m) => m.creativeId === creativeId));
    },
  },

  services: {
    async listByCreative(creativeId) {
      return copy(
        data.services
          .filter((s) => s.creativeId === creativeId)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      );
    },
    async listPublicByCreative(creativeId) {
      return copy(
        data.services
          .filter(
            (s) =>
              s.creativeId === creativeId &&
              (s.lifecycle === "PUBLISHED" || s.lifecycle === "UNAVAILABLE") &&
              s.moderation === "NORMAL",
          )
          .sort((a, b) => a.displayOrder - b.displayOrder),
      );
    },
    async getBySlug(creativeId, slug) {
      return copy(
        data.services.find((s) => s.creativeId === creativeId && s.slug === slug) ?? null,
      );
    },
    async getById(serviceId) {
      return copy(data.services.find((s) => s.id === serviceId) ?? null);
    },
    async listCategories() {
      return copy(
        data.categories.filter((c) => c.active).sort((a, b) => a.displayOrder - b.displayOrder),
      );
    },
  },

  requests: {
    async listForCreative(creativeId) {
      return copy(
        requests()
          .filter((r) => r.creativeId === creativeId)
          .sort(newestFirst),
      );
    },
    async listForClient(clientId) {
      return copy(
        requests()
          .filter((r) => r.clientId === clientId)
          .sort(newestFirst),
      );
    },
    async getDetail(requestId) {
      return copy(data.requestDetails.find((d) => d.request.id === requestId) ?? null);
    },
  },

  projects: {
    async listForCreative(creativeId) {
      return copy(data.projects.filter((p) => p.creativeId === creativeId));
    },
    async listForClient(clientId) {
      return copy(data.projects.filter((p) => p.clientId === clientId));
    },
    async getById(projectId) {
      return copy(data.projects.find((p) => p.id === projectId) ?? null);
    },
  },

  subscriptions: {
    async getForCreative(creativeId) {
      return copy(data.subscriptions.find((s) => s.creativeId === creativeId) ?? null);
    },
    async listCapacityPrices(at = data.FIXTURE_NOW) {
      const iso = at.toISOString();
      return copy(
        data.capacityPrices.filter(
          (p) => p.effectiveFrom <= iso && (p.effectiveUntil === null || p.effectiveUntil > iso),
        ),
      );
    },
    async listBillingEvents(subscriptionId) {
      return copy(
        data.billingEvents.filter((e) => e.subscriptionId === subscriptionId).sort(newestFirst),
      );
    },
  },

  notifications: {
    async listForUser(userId) {
      return copy(data.notifications.filter((n) => n.userId === userId).sort(newestFirst));
    },
    async unreadCount(userId) {
      return data.notifications.filter((n) => n.userId === userId && n.readAt === null).length;
    },
  },

  admin: {
    async isAdmin(userId) {
      return data.adminUsers.some((a) => a.userId === userId);
    },
    async listUsers() {
      return copy(data.users);
    },
    async listServices() {
      return copy(data.services);
    },
    async listRequests() {
      return copy(requests().sort(newestFirst));
    },
    async listSubscriptions() {
      return copy(data.subscriptions);
    },
    async listAuditEvents() {
      return copy([...data.auditEvents].sort(newestFirst));
    },
  },
};
