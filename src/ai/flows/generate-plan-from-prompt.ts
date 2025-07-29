
'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating a media plan from a natural language prompt.
 *
 * - generatePlanFromPrompt - A function that takes a user prompt and returns suggested media assets.
 * - GeneratePlanFromPromptInput - The input type for the function.
 * - GeneratePlanFromPromptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from './assign-invoice-number';
import { Asset } from '@/components/admin/media-manager-types';

const GeneratePlanFromPromptInputSchema = z.object({
  prompt: z.string().describe('The user\'s prompt describing the desired media plan.'),
});
export type GeneratePlanFromPromptInput = z.infer<typeof GeneratePlanFromPromptInputSchema>;

const SuggestedAssetSchema = z.object({
    id: z.string(),
    location: z.string(),
    rate: z.number(),
    reason: z.string().describe("A brief explanation of why this asset was chosen.")
});

const GeneratePlanFromPromptOutputSchema = z.object({
  suggestedAssets: z.array(SuggestedAssetSchema).describe('A list of suggested media assets that match the user\'s prompt.'),
});
export type GeneratePlanFromPromptOutput = z.infer<typeof GeneratePlanFromPromptOutputSchema>;

// This is a simplified function to get available assets. A real implementation would be more complex.
const getAvailableAssetsTool = ai.defineTool(
    {
        name: 'getAvailableAssets',
        description: 'Retrieves a list of all available media assets from the database.',
        outputSchema: z.array(z.object({
            id: z.string(),
            location: z.string().optional(),
            status: z.string(),
            rate: z.number().optional(),
        })),
    },
    async () => {
        const assetsSnapshot = await db.collection('mediaAssets').where('status', '==', 'active').get();
        const assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        return assets;
    }
);


export async function generatePlanFromPrompt(input: GeneratePlanFromPromptInput): Promise<GeneratePlanFromPromptOutput> {
  return generatePlanFromPromptFlow(input);
}

const plannerPrompt = ai.definePrompt({
  name: 'generatePlanFromPrompt',
  input: { schema: GeneratePlanFromPromptInputSchema },
  output: { schema: GeneratePlanFromPromptOutputSchema },
  tools: [getAvailableAssetsTool],
  prompt: `You are an expert media planner. A user will provide their requirements in a prompt, and you will use the available tools to find matching media assets and suggest a plan.

User Prompt: {{{prompt}}}

Your task is to analyze the user's prompt, use the getAvailableAssets tool to see the available inventory, and then select the most relevant assets that fit the criteria. For each selected asset, provide a brief "reason" explaining why it's a good fit for the user's plan.`,
});

const generatePlanFromPromptFlow = ai.defineFlow(
  {
    name: 'generatePlanFromPromptFlow',
    inputSchema: GeneratePlanFromPromptInputSchema,
    outputSchema: GeneratePlanFromPromptOutputSchema,
  },
  async (input) => {
    const { output } = await plannerPrompt(input);
    return output!;
  }
);
