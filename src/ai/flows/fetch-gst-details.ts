
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
import axios from 'axios';

const GstDetailsInputSchema = z.object({
  gstNumber: z.string().describe('The GST number of the business.'),
});
type GstDetailsInput = z.infer<typeof GstDetailsInputSchema>;

const GstDetailsOutputSchema = z.object({
    legalName: z.string().describe('The legal name of the business.'),
    tradeName: z.string().describe('The trade name of the business.'),
    address: z.string().describe('The principal place of business.'),
    city: z.string().describe('The city of the business address.'),
    state: z.string().describe('The state of the business address.'),
    pincode: z.string().describe('The pincode of the business address.'),
});
type GstDetailsOutput = z.infer<typeof GstDetailsOutputSchema>;

// This function calls a public API to fetch GST details.
async function getGstDataFromApi(gstNumber: string): Promise<GstDetailsOutput> {
    console.log(`Fetching data for GST: ${gstNumber}`);
    
    try {
        const response = await axios.get(`https://gst-api.webmasterdev.repl.co/api/search?gstin=${gstNumber}`);
        
        if (response.data && response.data.data) {
            const data = response.data.data;
            const addressParts = data.pradr.addr.split(', ');
            
            return {
                legalName: data.lgnm || '',
                tradeName: data.tradeNam || '',
                address: data.pradr.addr || '',
                city: data.pradr.addr.split(',').slice(-2, -1)[0]?.trim() || '',
                state: data.pradr.addr.split(',').slice(-3, -2)[0]?.trim() || '',
                pincode: data.pradr.addr.match(/\d{6}$/)?.[0] || '',
            };
        } else {
            throw new Error('Invalid response structure from GST API');
        }
    } catch (error: any) {
        console.error('Error fetching from GST API:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw new Error('Could not fetch details for the provided GST number. Please check the number and try again.');
    }
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
    const details = await getGstDataFromApi(input.gstNumber);
    return details;
  }
);
