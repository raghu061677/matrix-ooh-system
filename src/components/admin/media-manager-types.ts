
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


export const sampleAssets: Asset[] = [
    { id: 'A4-36', iid: 'A4-36', companyId: 'company-1', location: 'Abids, gpo, Towards Nampally', area: 'Abids', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.38734, longitude: 78.47783 },
    { id: 'A4-38', iid: 'A4-38', companyId: 'company-1', location: 'Afzal gunj, Towards Central Bus stand', area: 'Afzal Gunj', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.37369, longitude: 78.47883 },
    { id: 'A4-14', iid: 'A4-14', companyId: 'company-1', location: 'Amberpet, Towards Golnaka', area: 'Amberpet', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.39183, longitude: 78.51087 },
    { id: 'A4-1', iid: 'A4-1', companyId: 'company-1', location: 'Baghlingampally, Towards Narayanguda', area: 'Baghlingampally', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Non Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.40088, longitude: 78.49322 },
    { id: 'A2-10', iid: 'A2-10', companyId: 'company-1', location: 'Banjara Hills, Towards Masab Tank', area: 'Banjara Hills', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.40425, longitude: 78.45195 },
    { id: 'A4-40', iid: 'A4-40', companyId: 'company-1', location: 'Ranga Reddy, Dilsukhnagar, Towards LB Nagar', area: 'Dilsukhnagar', state: 'Telangana', district: 'Ranga Reddy', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '30X8', size: { width: 30, height: 8 }, totalSqft: 240, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.36873, longitude: 78.52418 },
    { id: 'A2-18', iid: 'A2-18', companyId: 'company-1', location: 'Erragadda, Towards Ameerpet', area: 'Erragadda', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Non Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.45293, longitude: 78.4358 },
    { id: 'A2-42', iid: 'A2-42', companyId: 'company-1', location: 'Film Nagar, Towards Film Nagar', area: 'Film Nagar', state: 'Telangana', district: 'Hyderabad', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.41785, longitude: 78.41113 },
    { id: 'A4-39', iid: 'A4-39', companyId: 'company-1', location: 'Hitech City, Towards Hitech City', area: 'Hitech City', state: 'Telangana', district: 'Ranga Reddy', status: 'active', media: 'Bus Shetter', lightType: 'Back Lit', rate: 50000, cardRate: 50000, baseRate: 35000, dimensions: '25X5', size: { width: 25, height: 5 }, totalSqft: 125, imageUrls: ['https://placehold.co/600x400.png'], latitude: 17.44402, longitude: 78.37829 },
    { id: 'KNR-C-01', iid: 'KNR-C-01', companyId: 'company-1', location: 'Karimnagar, Paramita H Towards Towers', area: 'Karimnagar', state: 'Telangana', district: 'Karimnagar', status: 'active', media: 'Cantilever', lightType: 'Back Lit', rate: 60000, cardRate: 60000, baseRate: 40000, dimensions: '30 X 10 X 2', size: { width: 30, height: 10 }, totalSqft: 600, multiface: true, size2: {width: 30, height: 10}, totalSqft2: 300, imageUrls: ['https://placehold.co/600x400.png'], latitude: 18.44184, longitude: 79.09773}
];

export const mediaTypes = [
    'Hoarding', 'Unipole', 'Gantry', 'Cantilever', 'Bus Shelter', 'Center Median', 'Wall Wrap', 'Metro Pillar'
];

export const lightTypes: AssetLightType[] = [
    'Back Lit', 'Non Lit', 'Front Lit', 'LED'
];
