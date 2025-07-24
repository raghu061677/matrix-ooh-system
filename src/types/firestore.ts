

import type { Timestamp } from 'firebase/firestore';

// /users/{uid}
export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'operations' | 'viewer';
  avatar?: string;
}

// /customers/{id}
export interface Customer {
  id: string;
  code: string;
  name: string;
  gst?: string;
  contactPersons?: {
    name: string;
    phone: string;
    designation: string;
  }[];
  addresses?: {
    type: 'billing' | 'shipping';
    street: string;
    city: string;
    state: string;
    postalCode: string;
  }[];
  assignedEmployeeId?: string; // Reference to users collection

  // Helper fields for table display
  primaryContact?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

// /salesEstimates/pendingInvoices/{id} | etc.
export interface Invoice {
    id: string;
    projectId?: string; // Reference
    employeeId?: string; // Reference
    customerId?: string; // Reference
    displayName?: string;
    fromDate?: Timestamp;
    toDate?: Timestamp;
    invoiceNumber?: string;
    invoiceAmount?: number;
    invoiceAmountWithTax?: number;
    haMarkup?: number;
    taMarkup?: number;
    qos?: number;
    status?: string;
}

// /purchaseOrders/pendingPOs/{id} | ...
export interface PurchaseOrder {
    id: string;
    projectId?: string;
    employeeId?: string;
    customerId?: string;
    displayName?: string;
    supplierId?: string;
    poNumber?: string;
    poDate?: Timestamp;
    fromDate?: Timestamp;
    toDate?: Timestamp;
    poStatus?: string;
    poAmount?: number;
    taMarkup?: number;
    invoiceDifference?: number;
    ageingFromStartDate?: number;
}

// /operations/mountingTasks/{id} | ...
export interface OperationTask {
    id: string;
    iid?: string;
    supplierId?: string;
    location?: string;
    size?: string;
    projectId?: string;
    employeeId?: string;
    customerId?: string;
    displayName?: string;
    creativeName?: string;
    plannedDate?: Timestamp;
    assignedMounter?: string;
    status?: string;
}

// /photoLibrary/photos/{id}
export interface Photo {
    id: string;
    category?: 'Geo-tagged' | 'Newspaper' | 'Traffic' | 'Other';
    type?: 'newspaper' | 'geotag' | 'traffic1' | 'traffic2';
    iid?: string;
    campaignId?: string;
    district?: string;
    city?: string;
    location?: string;
    width?: number;
    height?: number;
    sqft?: number;
    employeeId?: string;
    displayName?: string;
    photographer?: string;
    arrivalTimestamp?: Timestamp;
    storagePath?: string; // URL to image in Firebase Storage
}
