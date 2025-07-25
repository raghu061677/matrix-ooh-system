
'use server';

/**
 * @fileOverview This flow assigns a unique, sequential invoice number to a pending invoice.
 *
 * - assignInvoiceNumber - A function that takes a pending invoice ID, assigns the next available
 *   invoice number, and records the invoice date.
 * - AssignInvoiceNumberInput - The input type for the assignInvoiceNumber function.
 * - db - Exported Firestore instance for use in other flows.
 * - storage - Exported Firebase Storage instance for use in other flows.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';

// Centralized Firebase Admin SDK Initialization
if (!getApps().length) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace('gs://', ''),
    });
}

export const db = getFirestore();
export const storage = getStorage();


const AssignInvoiceNumberInputSchema = z.object({
  pendingInvoiceId: z.string().describe("The ID of the document in the 'salesEstimates/pendingInvoices/entries' collection."),
});
export type AssignInvoiceNumberInput = z.infer<typeof AssignInvoiceNumberInputSchema>;

export async function assignInvoiceNumber(input: AssignInvoiceNumberInput): Promise<{ invoiceNumber: string }> {
  return assignInvoiceNumberFlow(input);
}

const assignInvoiceNumberFlow = ai.defineFlow(
  {
    name: 'assignInvoiceNumberFlow',
    inputSchema: AssignInvoiceNumberInputSchema,
    outputSchema: z.object({ invoiceNumber: z.string() }),
  },
  async ({ pendingInvoiceId }) => {
    const counterRef = db.doc('counters/invoiceNumber');
    const invoiceRef = db.doc(`salesEstimates/pendingInvoices/entries/${pendingInvoiceId}`);

    const newInvoiceNumber = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let nextNumber = 1;
      if (counterDoc.exists) {
        nextNumber = (counterDoc.data()?.nextNumber || 0) + 1;
      }
      
      const formattedNumber = `INV-${String(nextNumber).padStart(5, '0')}`;

      transaction.set(counterRef, { nextNumber }, { merge: true });
      transaction.update(invoiceRef, { 
        invoiceNumber: formattedNumber,
        invoiceDate: FieldValue.serverTimestamp() 
      });

      return formattedNumber;
    });

    return { invoiceNumber: newInvoiceNumber };
  }
);
