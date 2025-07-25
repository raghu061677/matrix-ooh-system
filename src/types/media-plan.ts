
import type { Timestamp } from 'firebase/firestore';

export type PlanStatus = 'Draft' | 'Approved' | 'Rejected' | 'Converted';
export type CampaignStatus = 'Upcoming' | 'Running' | 'Completed';

export interface MediaPlan {
  id: string; // Firestore document ID
  companyId?: string;
  customerId: string;
  employeeId?: string;
  displayName?: string;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  mediaAssetIds?: string[];
  costSummary?: {
    totalBeforeTax: number;
    grandTotal: number;
  };
  status: PlanStatus;
  createdAt?: Date | Timestamp;
}

export type Campaign = {
  id: string;
  planId: string;
  title: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  images?: string[];
  status: CampaignStatus;
  companyId: string;
};
