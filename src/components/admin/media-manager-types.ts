

export type AssetStatus = 'active' | 'booked' | 'blocked' | 'deleted';

export interface Asset {
  id: string; // Document ID from Firestore
  mid?: string; // Media ID
  companyId?: string; // Reference to companies collection
  supplierId?: string;
  
  // Location
  location?: string;
  area?: string; // Landmark
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  direction?: string; // e.g., "Towards Gachibowli"

  // Details
  media?: string; // e.g., "Hoarding", "Unipole"
  light?: string; // "Frontlit", "Backlit", "Unlit"
  dimensions?: string; // e.g., "40 x 20"
  width1?: number;
  height1?: number;
  sqft?: number;
  units?: number;
  
  // Status & Rate
  status: AssetStatus;
  cardRate?: number; // Base rate
  baseRate?: number; // Negotiated rate
  
  // Images
  imageUrls?: string[];
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}


export const sampleAssets: Asset[] = [
    { id: 'asset-1', companyId: 'company-1', location: 'Abids beside Chermas, Hyderabad', area: 'Abids', city: 'Hyderabad', state: 'Telangana', status: 'active', cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-2', companyId: 'company-1', location: 'Abids, Beside GPO, Hyderabad', area: 'Abids', city: 'Hyderabad', state: 'Telangana', status: 'booked', cardRate: 45000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-3', companyId: 'company-1', location: 'Ameerpet Beside ICICI Bank, Hyderabad', area: 'Ameerpet', city: 'Hyderabad', state: 'Telangana', status: 'active', cardRate: 75000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-4', companyId: 'company-1', location: 'Banjara Hills, Opp GVK, Hyderabad', area: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', status: 'blocked', cardRate: 90000, imageUrls: ['https://placehold.co/600x400.png'] },
];
