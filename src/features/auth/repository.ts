import type { User } from "@/types";

export interface UserRepository {
  getById(userId: string): Promise<User | null>;
}
