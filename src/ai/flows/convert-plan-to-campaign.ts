'use server';

/**
 * @fileOverview This flow converts a media plan into a campaign.
 *
 * - convertPlanToCampaign - A function that takes a plan ID, copies it to the campaigns collection,
 *   and updates the original plan's status.
 * - ConvertPlanToCampaignInput - The input type for the convertPlanToCampaign function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const firebaseConfig = {
  credential: undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
if (!getApps().length) {
    initializeApp(firebaseConfig);
}
const db = getFirestore();

const ConvertPlanToCampaignInputSchema = z.object({
  planId: z.string().describe("The document ID of the plan to be converted."),
});
export type ConvertPlanToCampaignInput = z.infer<typeof ConvertPlanToCampaignInputSchema>;

export async function convertPlanToCampaign(input: ConvertPlanToCampaignInput): Promise<{ campaignId: string }> {
  return convertPlanToCampaignFlow(input);
}

const convertPlanToCampaignFlow = ai.defineFlow(
  {
    name: 'convertPlanToCampaignFlow',
    inputSchema: ConvertPlanToCampaignInputSchema,
    outputSchema: z.object({ campaignId: z.string() }),
  },
  async ({ planId }) => {
    const planRef = db.doc(`plans/${planId}`);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      throw new Error('Plan not found');
    }

    const planData = planDoc.data();
    
    // Create a new campaign document
    const campaignRef = db.collection('campaigns').doc();
    await campaignRef.set(planData!);

    // Update the original plan's status
    await planRef.update({ status: 'Converted' });

    return { campaignId: campaignRef.id };
  }
);
