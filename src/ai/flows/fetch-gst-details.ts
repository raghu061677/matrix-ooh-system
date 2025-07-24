'use server';
/**
 * @fileOverview A flow for fetching business details from a GST number.
 *
 * - fetchGstDetails - A function that takes a GST number and returns business details.
 * - GstDetailsInput - The input type for the fetchGstDetails function.
 * - GstDetailsOutput - The return type for the fetchGstDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GstDetailsInputSchema = z.object({
  gstNumber: z.string().describe('The GST number of the business.'),
});
export type GstDetailsInput = z.infer<typeof GstDetailsInputSchema>;

export const GstDetailsOutputSchema = z.object({
    legalName: z.string().describe('The legal name of the business.'),
    tradeName: z.string().describe('The trade name of the business.'),
    address: z.string().describe('The principal place of business.'),
    city: z.string().describe('The city of the business address.'),
    state: z.string().describe('The state of the business address.'),
    pincode: z.string().describe('The pincode of the business address.'),
});
export type GstDetailsOutput = z.infer<typeof GstDetailsOutputSchema>;

// This is a mock function. In a real scenario, this would call a GST API.
async function getGstDataFromApi(gstNumber: string): Promise<GstDetailsOutput> {
    console.log(`Fetching data for GST: ${gstNumber}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data
    return {
        legalName: 'ACME CORPORATION INDIA PVT LTD',
        tradeName: 'ACME Anvils',
        address: '123, M.G. Road, Film Nagar',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500096',
    };
}

export async function fetchGstDetails(input: GstDetailsInput): Promise<GstDetailsOutput> {
    return fetchGstDetailsFlow(input);
}

const fetchGstDetailsFlow = ai.defineFlow(
  {
    name: 'fetchGstDetailsFlow',
    inputSchema: GstDetailsInputSchema,
    outputSchema: GstDetailsOutputSchema,
  },
  async (input) => {
    // In a real application, you would call an external API here.
    // For this example, we are using a mock function.
    const details = await getGstDataFromApi(input.gstNumber);
    return details;
  }
);
