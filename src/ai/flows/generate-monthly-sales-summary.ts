'use server';

/**
 * @fileOverview This flow generates a monthly sales summary. This is intended to be run as a scheduled job.
 *
 * - generateMonthlySalesSummary - Aggregates sales data from invoices for the previous month
 *   and writes a summary document to a reports collection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from './assign-invoice-number'; // Import the shared db instance

export async function generateMonthlySalesSummary(): Promise<{ reportId: string, status: string }> {
  return generateMonthlySalesSummaryFlow({});
}

const generateMonthlySalesSummaryFlow = ai.defineFlow(
  {
    name: 'generateMonthlySalesSummaryFlow',
    inputSchema: z.object({}), // No input needed for a scheduled job
    outputSchema: z.object({ reportId: z.string(), status: z.string() }),
  },
  async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 for Jan, 1 for Feb, etc.)

    // Get the start and end of the *previous* month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoicesSnapshot = await db.collectionGroup('approvedInvoices')
        .where('invoiceDate', '>=', Timestamp.fromDate(startDate))
        .where('invoiceDate', '<=', Timestamp.fromDate(endDate))
        .get();
        
    let totalRealisedSales = 0;
    let totalUnrealisedSales = 0; // Assuming some logic to determine this, e.g., payment status

    invoicesSnapshot.forEach(doc => {
        const invoice = doc.data();
        // This is a simplified aggregation. You can add more complex logic here.
        totalRealisedSales += invoice.invoiceAmountWithTax || 0;
    });

    const reportId = `${year}-${String(month).padStart(2, '0')}`; // e.g., 2024-07
    const reportRef = db.doc(`reports/monthlySales/${reportId}`);

    await reportRef.set({
        generatedAt: FieldValue.serverTimestamp(),
        startDate,
        endDate,
        totalRealisedSales,
        totalUnrealisedSales,
        invoiceCount: invoicesSnapshot.size
    });

    return { reportId, status: 'Completed' };
  }
);
