'use server';

/**
 * @fileOverview This flow handles approval workflows for invoices and purchase orders.
 *
 * - approveInvoice - Moves an invoice from pending to approved.
 * - rejectInvoice - Updates an invoice's status to 'rejected'.
 * - approvePO - Moves a purchase order from pending to approved.
 * - rejectPO - Updates a PO's status to 'rejected'.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const firebaseConfig = {
  credential: undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
if (!getApps().length) {
    initializeApp(firebaseConfig);
}
const db = getFirestore();

// Common input schema for approval actions
const ApprovalInputSchema = z.object({
  documentId: z.string().describe("The ID of the document to approve/reject."),
  userId: z.string().describe("The ID of the user performing the action."),
});

// === INVOICE APPROVAL ===

export async function approveInvoice(input: z.infer<typeof ApprovalInputSchema>): Promise<{ status: string }> {
  const pendingRef = db.doc(`salesEstimates/pendingInvoices/${input.documentId}`);
  const approvedRef = db.doc(`salesEstimates/approvedInvoices/${input.documentId}`);
  
  await moveDocument(pendingRef, approvedRef, {
      status: 'approved',
      approvedBy: input.userId,
      approvedAt: FieldValue.serverTimestamp()
  });

  return { status: 'Invoice approved' };
}

export async function rejectInvoice(input: z.infer<typeof ApprovalInputSchema>): Promise<{ status: string }> {
  await db.doc(`salesEstimates/pendingInvoices/${input.documentId}`).update({
      status: 'rejected',
      rejectedBy: input.userId,
      rejectedAt: FieldValue.serverTimestamp()
  });
  return { status: 'Invoice rejected' };
}


// === PURCHASE ORDER APPROVAL ===

export async function approvePO(input: z.infer<typeof ApprovalInputSchema>): Promise<{ status: string }> {
  const pendingRef = db.doc(`purchaseOrders/pendingPOs/${input.documentId}`);
  const approvedRef = db.doc(`purchaseOrders/approvedPOs/${input.documentId}`);
  
  await moveDocument(pendingRef, approvedRef, {
      poStatus: 'approved',
      approvedBy: input.userId,
      approvedAt: FieldValue.serverTimestamp()
  });

  return { status: 'PO approved' };
}

export async function rejectPO(input: z.infer<typeof ApprovalInputSchema>): Promise<{ status: string }> {
  await db.doc(`purchaseOrders/pendingPOs/${input.documentId}`).update({
      poStatus: 'rejected',
      rejectedBy: input.userId,
      rejectedAt: FieldValue.serverTimestamp()
  });
  return { status: 'PO rejected' };
}

// Helper function to move a document between collections
async function moveDocument(oldRef: FirebaseFirestore.DocumentReference, newRef: FirebaseFirestore.DocumentReference, updateData: object) {
    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(oldRef);
        if (!doc.exists) {
            throw new Error("Document does not exist!");
        }
        const data = { ...doc.data(), ...updateData };
        transaction.set(newRef, data);
        transaction.delete(oldRef);
    });
}

// Note: We don't define flows here because these are simple operations.
// The exported functions can be called directly from the client.
// If more complex logic is needed, they can be wrapped in ai.defineFlow.
