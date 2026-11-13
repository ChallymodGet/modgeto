import type { Service, ServiceCategory } from "@/types";

export interface ServiceRepository {
  /** Every Service the Creative owns, for their own workspace. */
  listByCreative(creativeId: string): Promise<Service[]>;
  /**
   * Services shown on the public profile: Published and Unavailable, not
   * moderated, in the Creative's order (SRV-010, SRV-014).
   */
  listPublicByCreative(creativeId: string): Promise<Service[]>;
  getBySlug(creativeId: string, slug: string): Promise<Service | null>;
  getById(serviceId: string): Promise<Service | null>;
  listCategories(): Promise<ServiceCategory[]>;
}
