
'use server';

import { suggestMediaLocations } from '@/ai/flows/suggest-media-locations';
import { fetchGstDetails } from '@/ai/flows/fetch-gst-details';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  message: z.string().optional(),
  clientRequirements: z.string().min(10, {
    message: 'Requirements must be at least 10 characters to get suggestions.',
  }),
});

export async function getSuggestedLocations(formData: unknown) {
  const validatedFields = formSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid form data.',
      suggestions: null,
    };
  }
  
  try {
    const { clientRequirements } = validatedFields.data;
    const result = await suggestMediaLocations({ clientRequirements });
    return {
      error: null,
      suggestions: result.suggestedLocations,
    };
  } catch (error) {
    console.error('Error getting location suggestions:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
      suggestions: null,
    };
  }
}

const gstSchema = z.object({
    gstNumber: z.string().min(15).max(15),
});

export async function getGstDetails(formData: unknown) {
    const validatedFields = gstSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
            error: 'Invalid GST number.',
            data: null,
        };
    }

    try {
        const { gstNumber } = validatedFields.data;
        const result = await fetchGstDetails({ gstNumber });
        return {
            error: null,
            data: result,
        };
    } catch (error) {
        console.error('Error fetching GST details:', error);
        return {
            error: 'Failed to fetch GST details. Please try again.',
            data: null,
        };
    }
}
