
export type AssetStatus = 'active' | 'booked' | 'blocked' | 'deleted';
export type AssetOwnership = 'own' | 'rented';

export interface Asset {
  id: string; // Document ID from Firestore
  iid?: string; // Media ID
  name?: string; // New field from schema
  companyId?: string; // Reference to companies collection
  
  // Location
  location?: string;
  
  // Details
  media?: string; // e.g., "Hoarding", "Unipole"
  status: AssetStatus;
  rate?: number;
  ownership?: AssetOwnership;
  
  // Images
  imageUrls?: string[];
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}


export const sampleAssets: Asset[] = [
    { id: 'asset-1', companyId: 'company-1', name: 'Abids Hoarding', location: 'Abids beside Chermas, Hyderabad', status: 'active', rate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-2', companyId: 'company-1', name: 'GPO Unipole', location: 'Abids, Beside GPO, Hyderabad', status: 'booked', rate: 45000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-3', companyId: 'company-1', name: 'Ameerpet ICICI Wall', location: 'Ameerpet Beside ICICI Bank, Hyderabad', status: 'active', rate: 75000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-4', companyId: 'company-1', name: 'Banjara Hills GVK', location: 'Banjara Hills, Opp GVK, Hyderabad', status: 'blocked', rate: 90000, imageUrls: ['https://placehold.co/600x400.png'] },
];
