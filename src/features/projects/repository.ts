import type { Project } from "@/types";

export interface ProjectRepository {
  listForCreative(creativeId: string): Promise<Project[]>;
  listForClient(clientId: string): Promise<Project[]>;
  getById(projectId: string): Promise<Project | null>;
}
