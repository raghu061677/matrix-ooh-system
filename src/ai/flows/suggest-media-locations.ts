'use server';

/**
 * @fileOverview This file contains the Genkit flow for suggesting relevant media locations based on client input.
 *
 * - suggestMediaLocations - A function that takes client requirements as input and returns suggested media locations.
 * - SuggestMediaLocationsInput - The input type for the suggestMediaLocations function.
 * - SuggestMediaLocationsOutput - The return type for the suggestMediaLocations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMediaLocationsInputSchema = z.object({
  clientRequirements: z
    .string()
    .describe('The requirements of the client for media locations.'),
});
export type SuggestMediaLocationsInput = z.infer<typeof SuggestMediaLocationsInputSchema>;

const SuggestMediaLocationsOutputSchema = z.object({
  suggestedLocations: z
    .string()
    .describe('A list of suggested media locations based on the client requirements.'),
});
export type SuggestMediaLocationsOutput = z.infer<typeof SuggestMediaLocationsOutputSchema>;

export async function suggestMediaLocations(input: SuggestMediaLocationsInput): Promise<SuggestMediaLocationsOutput> {
  return suggestMediaLocationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMediaLocationsPrompt',
  input: {schema: SuggestMediaLocationsInputSchema},
  output: {schema: SuggestMediaLocationsOutputSchema},
  prompt: `You are an expert media location advisor. A client will provide their requirements, and you will suggest the most relevant media locations.

Client Requirements: {{{clientRequirements}}}

Suggested Media Locations:`,
});

const suggestMediaLocationsFlow = ai.defineFlow(
  {
    name: 'suggestMediaLocationsFlow',
    inputSchema: SuggestMediaLocationsInputSchema,
    outputSchema: SuggestMediaLocationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
