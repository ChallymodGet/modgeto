/** Lightweight V1 Project (docs/03 §47–52, PRJ-004). No tasks, milestones, chat or deliverables (V2). */
import type { Currency, ProjectStatus } from "@/lib/domain";
import type { ID, Timestamp } from "./identity";
import type { BriefSnapshot, CommercialAgreement, ServiceSnapshot } from "./request";
import type { Turnaround } from "./service";

export type PaymentSummary = {
  currency: Currency;
  projectTotalMinor: bigint;
  requiredCommitmentMinor: bigint | null;
  totalConfirmedMinor: bigint;
  outstandingBalanceMinor: bigint;
};

export type Project = {
  id: ID;
  requestId: ID;
  creativeId: ID;
  clientId: ID;
  title: string;
  service: ServiceSnapshot;
  agreement: CommercialAgreement;
  brief: BriefSnapshot;
  /** Captured at Project Start (docs/03 §70). */
  paymentSummary: PaymentSummary;
  agreedTimeline: Turnaround;
  status: ProjectStatus;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
};
