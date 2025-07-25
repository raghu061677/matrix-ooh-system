
export type AssetStatus = 'Available' | 'Booked' | 'Blocked';

export type Asset = {
  id: string; // Document ID from Firestore
  companyId: string; // Reference to companies collection
  name: string;
  location: string;
  status: AssetStatus;
  image1?: string;
  image2?: string;
  rate?: number;
  createdAt?: Date;
  imageUrls?: string[]; // Legacy or for UI convenience
};

export const sampleAssets: Asset[] = [
    { id: 'asset-1', companyId: 'company-1', name: 'Abids Billboard', location: 'Abids beside Chermas, Hyderabad', status: 'Available', rate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-2', companyId: 'company-1', name: 'GPO Crossing', location: 'Abids, Beside GPO, Hyderabad', status: 'Booked', rate: 45000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-3', companyId: 'company-1', name: 'Ameerpet Junction', location: 'Ameerpet Beside ICICI Bank, Hyderabad', status: 'Available', rate: 75000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-4', companyId: 'company-1', name: 'Banjara Hills Rd No 1', location: 'Banjara Hills, Opp GVK, Hyderabad', status: 'Blocked', rate: 90000, imageUrls: ['https://placehold.co/600x400.png'] },
];
