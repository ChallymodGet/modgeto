import type { CreativeProfile, PaymentMethod } from "@/types";

export interface CreativeProfileRepository {
  /** Case-insensitive (PROF-003). */
  getByUsername(username: string): Promise<CreativeProfile | null>;
  getByUserId(userId: string): Promise<CreativeProfile | null>;
  /** Private: only for the owner, or a Client at the payment stage (PAY-003). */
  listPaymentMethods(creativeId: string): Promise<PaymentMethod[]>;
}
