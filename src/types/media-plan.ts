
import type { Timestamp } from 'firebase/firestore';
import type { User } from './firestore';

export type MediaPlanStatus = 'Draft' | 'Confirmed' | 'Cancelled' | 'Active' | 'Pending' | 'Converted';

export type MediaPlan = {
  id: string; // Firestore document ID
  projectId: string;
  employeeId?: string; // Reference to users collection
  employee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  customer?: string; // Reference to customers collection
  displayName: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  days?: number;
  sqft?: number;
  amount?: number;
  qos?: string;
  isRotational?: boolean;
  notes?: string;
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
  status: MediaPlanStatus;
};

// Campaigns have an identical structure to plans.
export type Campaign = MediaPlan;

    

    