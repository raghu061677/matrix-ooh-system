
import type { Timestamp } from 'firebase/firestore';

export interface Invoice {
    id: string;
    planId: string;
    customerId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    invoiceAmount: number;
    invoiceAmountWithTax: number;
    companyId: string;
    invoiceDate: Timestamp;
    invoiceNumber: string;
    createdAt: Timestamp;
}

export interface CreditNote {
    id: string;
    invoiceId: string;
    customerId: string;
    reason: string;
    amount: number;
    dateIssued: Timestamp;
    companyId: string;
}

export interface RecurringInvoice {
    id: string;
    customerId: string;
    startDate: Timestamp;
    endDate: Timestamp;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    invoiceAmount: number;
    companyId: string;
}

export interface PurchaseOrder {
    id: string;
    planId: string;
    customerId: string;
    employeeId: string;
    poStatus: 'generated' | 'approved' | 'rejected';
    poAmount: number;
    companyId: string;
    createdAt: Timestamp;
    poNumber?: string;
}
