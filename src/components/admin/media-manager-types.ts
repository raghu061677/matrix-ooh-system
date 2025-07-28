
export type AssetStatus = 'active' | 'booked' | 'blocked' | 'deleted';
export type AssetOwnership = 'own' | 'rented';
export type AssetLightType = 'Back Lit' | 'Non Lit' | 'Front Lit' | 'LED';

export interface Asset {
  id: string; // Document ID from Firestore
  iid?: string; // Media ID
  name?: string; // Location Name
  companyId?: string; // Reference to companies collection
  
  // Location
  state?: string;
  district?: string;
  area?: string;
  location?: string; // Location Description
  direction?: string;
  latitude?: number;
  longitude?: number;
  
  // Details
  media?: string; // e.g., "Hoarding", "Unipole"
  lightType?: AssetLightType;
  status: AssetStatus;
  cardRate?: number;
  baseRate?: number;
  ownership?: AssetOwnership;
  dimensions?: string;
  size?: { width?: number; height?: number };
  size2?: { width?: number; height?: number };
  totalSqft?: number;
  totalSqft2?: number;
  multiface?: boolean;
  
  // Images
  imageUrls?: string[];
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}


export const sampleAssets: Asset[] = [
    { id: 'asset-1', companyId: 'company-1', name: 'Abids Hoarding', location: 'Abids beside Chermas, Hyderabad', area: 'Abids', state: 'Telangana', district: 'Hyderabad', status: 'active', cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-2', companyId: 'company-1', name: 'GPO Unipole', location: 'Abids, Beside GPO, Hyderabad', area: 'Abids', state: 'Telangana', district: 'Hyderabad', status: 'booked', cardRate: 45000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-3', companyId: 'company-1', name: 'Ameerpet ICICI Wall', location: 'Ameerpet Beside ICICI Bank, Hyderabad', area: 'Ameerpet', state: 'Telangana', district: 'Hyderabad', status: 'active', cardRate: 75000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-4', companyId: 'company-1', name: 'Banjara Hills GVK', location: 'Banjara Hills, Opp GVK, Hyderabad', area: 'Banjara Hills', state: 'Telangana', district: 'Hyderabad', status: 'blocked', cardRate: 90000, imageUrls: ['https://placehold.co/600x400.png'] },
];

export const mediaTypes = [
    'Hoarding', 'Unipole', 'Gantry', 'Cantilever', 'Bus Shelter', 'Center Median', 'Wall Wrap', 'Metro Pillar'
];

export const lightTypes: AssetLightType[] = [
    'Back Lit', 'Non Lit', 'Front Lit', 'LED'
];
