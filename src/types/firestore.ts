
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Document ID from Firestore
  uid: string; // Firebase Auth UID
  companyId?: string; // Reference to companies collection
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'operations' | 'viewer' | 'superadmin' | 'finance';
  avatar?: string;
}

export interface Customer {
  id: string; // Document ID from Firestore
  companyId: string; // Reference to companies collection
  code: string;
  name: string;
  gst?: string;
  contactPersons?: ContactPerson[];
  addresses?: Address[];
}

export interface ContactPerson {
  name: string;
  email?: string;
  phone: string;
  designation: string;
}

export interface Address {
  type: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  assetId: string;
  assetLocation?: string;
  assetCity?: string;
  submittedAt: Timestamp;
}

