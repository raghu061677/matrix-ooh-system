
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Document ID from Firestore
  uid: string; // Firebase Auth UID
  companyId?: string; // Reference to companies collection
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'operations' | 'viewer' | 'superadmin' | 'finance' | 'mounter';
  avatar?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
}

export interface Customer {
  id: string; // Document ID from Firestore
  companyId: string; // Reference to companies collection
  name: string;
  gst?: string;
  email?: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  assetId: string;
  submittedAt: Timestamp;
}
