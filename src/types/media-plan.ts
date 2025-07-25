
import type { Timestamp } from 'firebase/firestore';

export type PlanStatus = 'Draft' | 'Approved' | 'Rejected';
export type CampaignStatus = 'Upcoming' | 'Running' | 'Completed';

export type MediaPlan = {
  id: string; // Firestore document ID
  clientId: string; 
  mediaAssetIds: string[];
  status: PlanStatus;
  total?: number;
  createdAt?: Date | Timestamp;
  // Optional fields for UI convenience
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
};

export type Campaign = {
  id: string;
  planId: string;
  title: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  images: string[];
  status: CampaignStatus;
  createdAt?: Date | Timestamp;
};
