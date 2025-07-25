
'use server';

/**
 * @fileOverview This flow manages company settings for SaaS branding.
 *
 * - getCompanySettings: Fetches the current company settings.
 * - updateCompanySettings: Updates text-based company settings.
 * - updateCompanyLogo: Uploads a new company logo and returns the URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';

const firebaseConfig = {
  credential: undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace('gs://', ''),
};

if (!getApps().length) {
    initializeApp(firebaseConfig);
}
const db = getFirestore();
const storage = getStorage();

const CompanySettingsSchema = z.object({
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
});
type CompanySettings = z.infer<typeof CompanySettingsSchema>;

const settingsDocRef = db.doc('app_settings/company');


export async function getCompanySettings(): Promise<CompanySettings | null> {
    const doc = await settingsDocRef.get();
    if (!doc.exists) {
        return null;
    }
    return doc.data() as CompanySettings;
}

export async function updateCompanySettings(input: CompanySettings): Promise<{ success: boolean }> {
    await settingsDocRef.set(input, { merge: true });
    return { success: true };
}


const UpdateCompanyLogoInputSchema = z.object({
  logoDataUri: z.string().describe("The new logo image as a Base64 data URI."),
  contentType: z.string().describe("The MIME type of the image (e.g., 'image/png')."),
});

const UpdateCompanyLogoOutputSchema = z.object({
  logoUrl: z.string().url().describe("The public download URL of the uploaded logo."),
});


export async function updateCompanyLogo(input: z.infer<typeof UpdateCompanyLogoInputSchema>): Promise<z.infer<typeof UpdateCompanyLogoOutputSchema>> {
  return updateCompanyLogoFlow(input);
}


const updateCompanyLogoFlow = ai.defineFlow(
  {
    name: 'updateCompanyLogoFlow',
    inputSchema: UpdateCompanyLogoInputSchema,
    outputSchema: UpdateCompanyLogoOutputSchema,
  },
  async ({ logoDataUri, contentType }) => {
    const fileExtension = contentType.split('/')[1] || 'png';
    const filePath = `branding/logo.${fileExtension}`;
    const file = storage.bucket().file(filePath);

    const base64Data = logoDataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    await file.save(buffer, {
        metadata: {
            contentType,
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
    });
    
    const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A very far future date for public access
    });

    // Save the new URL to the settings document
    await settingsDocRef.set({ logoUrl: downloadUrl }, { merge: true });

    return { logoUrl: downloadUrl };
  }
);
