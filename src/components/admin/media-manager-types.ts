
export type AssetStatus = 'active' | 'booked' | 'blocked' | 'deleted';
export type AssetOwnership = 'own' | 'rented';
export type AssetLightType = 'Back Lit' | 'Non Lit' | 'Front Lit' | 'LED';

export interface Asset {
  id: string; // Document ID from Firestore
  iid?: string; // Media ID
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
  rate?: number;
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


export const sampleAssets: Asset[] = [];

export const mediaTypes = [
    'Hoarding', 'Unipole', 'Gantry', 'Cantilever', 'Bus Shelter', 'Center Median', 'Wall Wrap', 'Metro Pillar'
];

export const lightTypes: AssetLightType[] = [
    'Back Lit', 'Non Lit', 'Front Lit', 'LED'
];
