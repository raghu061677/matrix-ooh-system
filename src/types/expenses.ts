
import type { Timestamp } from 'firebase/firestore';

export interface PowerBill {
  id: string; // Firestore document ID
  companyId: string;
  assetId: string; // Reference to the media_assets collection
  assetInfo?: {
      area?: string;
      location?: string;
      direction?: string;
  };
  connectionName: string;
  meterNumber: string;
  serviceNumber: string;
  arrears: number;
  duePayments: number;
  totalDue: number;
  units: number;
  billDate: Timestamp;
  dueDate: Timestamp;
  paidAmount: number;
  paidDate: Timestamp;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface GeneralExpense {
    id: string;
    companyId: string;
    expenseType: 'Printing' | 'Mounting' | 'Travel' | 'Office';
    description: string;
    amount: number;
    expenseDate: Timestamp;
    vendor?: string;
    receiptUrl?: string; // Link to receipt in Firebase Storage
    relatedAssetId?: string; // Optional link to a media asset
    relatedPlanId?: string; // Optional link to a media plan
}
