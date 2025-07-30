'use server';

/**
 * @fileOverview This flow recalculates the cost summary for a media plan.
 *
 * - recalculatePlanCost - A function that takes plan cost components and returns the full
 *   cost summary including taxes and totals. This is useful for on-the-fly recalculations
 *   on the client before saving to the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CostComponentsSchema = z.object({
  displayCost: z.number().default(0),
  printingCost: z.number().default(0),
  installationCost: z.number().default(0),
});

const CostSummarySchema = z.object({
    totalBeforeTax: z.number(),
    gst: z.number(),
    grandTotal: z.number(),
});

export async function recalculatePlanCost(input: z.infer<typeof CostComponentsSchema>): Promise<z.infer<typeof CostSummarySchema>> {
  return recalculatePlanCostFlow(input);
}

const recalculatePlanCostFlow = ai.defineFlow(
  {
    name: 'recalculatePlanCostFlow',
    inputSchema: CostComponentsSchema,
    outputSchema: CostSummarySchema,
  },
  async ({ displayCost, printingCost, installationCost }) => {
    const totalBeforeTax = displayCost + printingCost + installationCost;
    // Standard Indian GST rate for advertising services
    const gst = totalBeforeTax * 0.18; 
    const grandTotal = totalBeforeTax + gst;
    
    return {
      totalBeforeTax,
      gst,
      grandTotal,
    };
  }
);

/**
 * Note on Firestore Triggers:
 * Genkit does not have a direct equivalent to Cloud Function's Firestore triggers (e.g., onUpdate).
 * To achieve a similar result, you would call a flow like this from your client-side code
 * whenever the user updates a value that affects the total cost.
 *
 * For example, in your plan editing UI, when the user changes the 'displayCost',
 * you would call `recalculatePlanCostFlow` with the new values and then update
 * both the input values and the calculated totals in your component's state before saving
 * the entire plan document back to the database.
 */
