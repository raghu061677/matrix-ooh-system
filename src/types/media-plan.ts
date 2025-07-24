
import type { Timestamp } from 'firebase/firestore';

export type MediaPlan = {
  id: string; // Firestore document ID
  projectId?: string;
  employeeId?: string; // Reference to users collection
  customerId?: string; // Reference to customers collection
  displayName: string;
  startDate: Timestamp;
  endDate: Timestamp;
  days?: number;
  statistics?: {
    haMarkupPercentage?: number;
    taMarkupPercentage?: number;
    occupancyPercentage?: number;
    roiPercentage?: number;
  };
  inventorySummary?: {
    homeCount?: number;
    rentedCount?: number;
    totalSites?: number;
    pricePerSqft?: number;
    pricePerSqftPerMonth?: number;
  };
  clientGrade?: {
    unbilledSales?: number;
    effectiveSales?: number;
    paymentReceived?: number;
    outstandingSales?: number;
  };
  costSummary?: {
    displayCost?: number;
    printingCost?: number;
    installationCost?: number;
    totalBeforeTax?: number;
    gst?: number;
    grandTotal?: number;
  };
  documents?: {
    emailConfirmations?: number;
    purchaseOrders?: number;
    others?: number;
  };
  status: 'active' | 'pending' | 'converted';
};

// Campaigns have an identical structure to plans.
export type Campaign = MediaPlan;
