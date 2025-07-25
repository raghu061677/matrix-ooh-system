
import type { Timestamp } from 'firebase/firestore';
import { User } from './firestore';

export type PlanStatus = 'Draft' | 'Approved' | 'Rejected' | 'Confirmed' | 'Active';
export type CampaignStatus = 'active' | 'inactive'; // Adjusted based on provided schema

export interface MediaPlan {
  id: string; // Firestore document ID
  projectId?: string;
  employeeId: string;
  employee?: {
      id: string;
      name: string;
      avatar?: string;
  }
  customerId: string;
  customerName?: string;
  displayName: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  days: number;
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
  costSummary?: {
    displayCost: number;
    printingCost: number;
    installationCost: number;
    totalBeforeTax: number;
    gst: number;
    grandTotal: number;
  };
  documents?: {
    emailConfirmations: number;
    purchaseOrders: number;
    others: number;
  };
  status: PlanStatus;
  createdAt?: Date | Timestamp;
  exports?: {
    pdfUrl?: string;
    excelUrl?: string;
    pptUrl?: string;
    lastGeneratedAt?: Date | Timestamp;
  };
}

export type Campaign = {
  id: string;
  displayName: string;
  customerId: string;
  employeeId: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  status: CampaignStatus;
  costSummary: {
      totalBeforeTax: number;
      grandTotal: number;
  };
  companyId: string;
};
