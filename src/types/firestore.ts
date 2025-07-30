
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Document ID from Firestore
  uid: string; // Firebase Auth UID
  companyId?: string; // Reference to companies collection
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'operations' | 'viewer' | 'superadmin' | 'finance' | 'mounter';
  avatar?: string;
  status?: 'active' | 'inactive';
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
}

export interface ContactPerson {
    name: string;
    email: string;
    phone: string;
}

export interface Customer {
  id: string; // Document ID from Firestore
  companyId: string; // Reference to companies collection
  name: string;
  gst?: string;
  pan?: string;
  email?: string; // Main email
  phone?: string; // Main phone
  website?: string;
  paymentTerms?: 'Net 15' | 'Net 30' | 'Net 60' | 'Due on receipt';
  billingAddress?: Address;
  shippingAddress?: Address;
  contactPersons?: ContactPerson[];
  notes?: string;
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
