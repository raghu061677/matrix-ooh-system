
import type { Timestamp } from 'firebase/firestore';
import { User } from './firestore';
import { Asset } from './admin/media-manager-types';

export type PlanStatus = 'Draft' | 'Approved' | 'Rejected' | 'Converted' | 'Confirmed';
export type CampaignStatus = 'Running' | 'Completed' | 'Cancelled';

export interface MediaPlan {
  id: string; // Firestore document ID
  companyId?: string;
  projectId?: string;
  
  // People
  customerId: string;
  customerName?: string;
  employeeId?: string;
  employee?: Partial<User>;

  name?: string;
  displayName?: string;
  
  // Dates
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  days?: number;

  mediaAssetIds?: string[];
  mediaAssets?: Partial<Asset>[];

  // Summaries & Statistics
  costSummary?: {
    displayCost: number;
    printingCost: number;
    installationCost: number;
    totalBeforeTax: number;
    gst: number;
    grandTotal: number;
  };
  statistics?: {
    haMarkupPercentage: number;
    taMarkupPercentage: number;
    roiPercentage: number;
    occupancyPercentage: number;
    haMarkup: number;
    taMarkup: number;
  };
  inventorySummary?: {
    homeCount: number;
    rentedCount: number;
    totalSites: number;
    pricePerSqft: number;
    pricePerSqftPerMonth: number;
    totalSqft: number;
  };
   clientGrade?: {
    unbilledSales: number;
    effectiveSales: number;
    paymentReceived: number;
    outstandingSales: number;
  };
   documents?: {
    emailConfirmations: number;
    purchaseOrders: number;
    others: number;
  };

  status: PlanStatus;
  createdAt?: Date | Timestamp;
}

export type Campaign = MediaPlan & {
  planId: string;
  status: CampaignStatus;
};
