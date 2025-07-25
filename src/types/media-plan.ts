

import type { Timestamp } from 'firebase/firestore';

export type MediaPlanStatus = 'Draft' | 'Confirmed' | 'Cancelled' | 'Active' | 'Pending' | 'Converted';

export type MediaPlan = {
  id: string; // Firestore document ID
  companyId: string;
  projectId: string;
  employeeId?: string; // Reference to users collection
  employee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  customerId?: string; // Reference to customers collection
  customerName?: string;
  displayName: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  days?: number;
  isRotational?: boolean;
  notes?: string;
  statistics?: {
    haMarkup?: number;
    haMarkupPercentage?: number;
    taMarkup?: number;
    taMarkupPercentage?: number;
    occupancyPercentage?: number;
    roiPercentage?: number;
    qos?: string;
  };
  inventorySummary?: {
    homeCount?: number;
    rentedCount?: number;
    totalSites?: number;
    pricePerSqft?: number;
    pricePerSqftPerMonth?: number;
    totalSqft?: number;
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
  exportReady?: boolean;
  exports?: {
    pptUrl?: string;
    pdfUrl?: string;
    excelUrl?: string;
    lastGeneratedAt?: Timestamp;
  }
};

// Campaigns have an identical structure to plans.
export type Campaign = MediaPlan;
