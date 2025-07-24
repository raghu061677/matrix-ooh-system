'use server';

/**
 * @fileOverview This flow generates a PowerPoint presentation for a campaign.
 *
 * - generateCampaignPpt - A function that takes a campaign ID, fetches its assets and photos,
 *   compiles them into a PPTX file, uploads it to Firebase Storage, and returns the URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import PptxGenJS from 'pptxgenjs';
import fetch from 'node-fetch';

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

const GenerateCampaignPptInputSchema = z.object({
  campaignId: z.string().describe("The ID of the campaign document."),
});
export type GenerateCampaignPptInput = z.infer<typeof GenerateCampaignPptInputSchema>;

const GenerateCampaignPptOutputSchema = z.object({
  downloadUrl: z.string().url().describe("The public download URL of the generated PPTX file."),
});
export type GenerateCampaignPptOutput = z.infer<typeof GenerateCampaignPptOutputSchema>;


export async function generateCampaignPpt(input: GenerateCampaignPptInput): Promise<GenerateCampaignPptOutput> {
  return generateCampaignPptFlow(input);
}


// Helper function to fetch an image and convert it to a base64 data URI
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (error) {
    console.error(`Error converting image to base64: ${url}`, error);
    // Return a placeholder or handle the error as needed
    return ''; 
  }
}

const generateCampaignPptFlow = ai.defineFlow(
  {
    name: 'generateCampaignPptFlow',
    inputSchema: GenerateCampaignPptInputSchema,
    outputSchema: GenerateCampaignPptOutputSchema,
  },
  async ({ campaignId }) => {
    // 1. Fetch Campaign and associated assets
    const campaignRef = db.doc(`campaigns/${campaignId}`);
    const campaignDoc = await campaignRef.get();
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found.`);
    }
    const campaignData = campaignDoc.data();

    // Assuming assets are stored in a subcollection or an array of references/IDs
    const assetsSnapshot = await db.collection(`campaigns/${campaignId}/assets`).get();
    const assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Create a title slide
    pptx.addSlide().addText(campaignData?.displayName || 'Campaign Report', { 
        x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 36, bold: true 
    });

    // 2. Loop through assets to create slides
    for (const asset of assets) {
      // 3. Fetch photos for each asset
      const photosSnapshot = await db.collection('photoLibrary/photos')
        .where('iid', '==', asset.id)
        .limit(4)
        .get();
        
      const photoUrls = photosSnapshot.docs.map(doc => doc.data().storagePath).filter(Boolean);
      const photoPromises = photoUrls.map(url => imageToBase64(url));
      const photoDataUris = await Promise.all(photoPromises);

      // Create slides for this asset, 2 images per slide
      for (let i = 0; i < photoDataUris.length; i += 2) {
        const slide = pptx.addSlide();
        
        slide.addText(
          `Location: ${asset.location || 'N/A'}\nSize: ${asset.dimensions || 'N/A'}`,
          { x: 0.5, y: 0.25, w: '90%', h: 0.5, fontSize: 14 }
        );

        // Add first image if it exists
        if (photoDataUris[i]) {
          slide.addImage({
            data: photoDataUris[i],
            x: 0.5, y: 1, w: 4, h: 4,
          });
        }

        // Add second image if it exists
        if (photoDataUris[i + 1]) {
           slide.addImage({
            data: photoDataUris[i+1],
            x: 5.5, y: 1, w: 4, h: 4,
          });
        }
      }
    }

    // 4. Generate PPTX buffer and upload to Storage
    const pptxBuffer = await pptx.write({ outputType: 'buffer' });
    const filePath = `campaign-ppts/${campaignId}-${Date.now()}.pptx`;
    const file = storage.bucket().file(filePath);

    await file.save(pptxBuffer as Buffer, {
        metadata: {
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
    });
    
    // 5. Return the public URL
    const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Far-future expiration date
    });
    
    return { downloadUrl };
  }
);
