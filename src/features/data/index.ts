/**
 * The single data-access entry point for screens and Server Actions.
 * Fixtures until Phase 8, then Supabase behind the same interfaces (D-022).
 */
import "server-only";
import type { AdminRepository } from "@/features/admin/repository";
import type { UserRepository } from "@/features/auth/repository";
import type { CreativeProfileRepository } from "@/features/creative-profile/repository";
import type { NotificationRepository } from "@/features/notifications/repository";
import type { ProjectRepository } from "@/features/projects/repository";
import type { RequestRepository } from "@/features/requests/repository";
import type { ServiceRepository } from "@/features/services/repository";
import type { SubscriptionRepository } from "@/features/subscriptions/repository";
import { fixtureRepositories } from "./fixture-repositories";

export type Repositories = {
  users: UserRepository;
  creatives: CreativeProfileRepository;
  services: ServiceRepository;
  requests: RequestRepository;
  projects: ProjectRepository;
  subscriptions: SubscriptionRepository;
  notifications: NotificationRepository;
  admin: AdminRepository;
};

export const repositories: Repositories = fixtureRepositories;
