
export type Asset = {
  id: string; // Document ID from Firestore
  mid?: string;
  ownership?: 'own' | 'rented';
  media?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  location?: string;
  direction?: string; // For traffic direction
  dimensions?: string;
  structure?: 'single' | 'multi';
  width1?: number;
  height1?: number;
  width2?: number;
  height2?: number;
  sqft?: number;
  light?: 'BackLit' | 'Non-Lit' | 'Front-Lit';
  status?: 'active' | 'deleted';
  supplierId?: string; // Reference to suppliers collection
  contractDetails?: {
    ownerName: string;
    contractStartDate: Date;
    contractEndDate: Date;
  };
  imageUrls?: string[];
  latitude?: number;
  longitude?: number;
  baseRate?: number;
  cardRate?: number;
};

export const sampleAssets: Asset[] = [
    { id: 'asset-1', mid: '13159', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Abids', location: 'Abids beside Chermas', direction: 'Towards Nampally', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.3929, longitude: 78.476295, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-2', mid: '17252', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Abids', location: 'Abids beside Chermas', direction: 'Towards Koti', dimensions: "30' x 10'", width1: 30, height1: 9.5, sqft: 136.50, light: 'BackLit', status: 'active', latitude: 17.3930, longitude: 78.476104, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-3', mid: '17335', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Abids', location: 'Abids, Beside GPO', direction: 'Towards Abids', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.3932, longitude: 78.476378, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-4', mid: '78693', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Afzal Gunj', location: 'Afzal Gunj, Beside Central Library', direction: 'Towards High Court', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'Non-Lit', status: 'active', latitude: 17.3708, longitude: 78.477857, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-5', mid: '11831', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Amberpet', location: 'Amberpet, 6 Number', direction: 'Towards Uppal', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'Non-Lit', status: 'active', latitude: 17.3934, longitude: 78.518866, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-6', mid: '16474', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Amberpet', location: 'Amberpet Police Line', direction: 'Towards Koti', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.3922, longitude: 78.516719, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-7', mid: 'A4-14', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Ameerpet', location: 'Ameerpet Beside ICICI Bank', direction: 'Towards Begumpet', dimensions: "25' x 9'", width1: 25, height1: 9, sqft: 135.00, light: 'BackLit', status: 'active', latitude: 17.4363, longitude: 78.447686, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-8', mid: '34644', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Ameerpet', location: 'Ameerpet Beside Sharada Model Picture', direction: 'Towards Punjagutta', dimensions: "25' x 10'", width1: 25, height1: 9.75, sqft: 154.75, light: 'BackLit', status: 'active', latitude: 17.4370, longitude: 78.448901, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-9', mid: '11857', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Baghlingampally', location: 'Baghlingampally Beside Ambedkar College', direction: 'Towards RTC X Roads', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'Non-Lit', status: 'active', latitude: 17.4042, longitude: 78.499219, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-10', mid: '18263', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjara Hills, Indo American Cancer Hospital', direction: 'Towards KBR Park', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4184, longitude: 78.429292, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-11', mid: 'A4-10', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjara Hills, Rd No 1, OPP Taj Krishna', direction: 'Towards City Center', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4239, longitude: 78.440242, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-12', mid: 'A2-26', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjara Hills Road No 1, Masabtank', direction: 'Towards Lakdikapul', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4116, longitude: 78.451951, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-13', mid: '19066', ownership: 'own', media: 'Unipole', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjara Hills Road No.1, Opp GVK', direction: 'Towards Masabtank', dimensions: "30' x 15'", width1: 30, height1: 14.5, sqft: 223.50, light: 'BackLit', status: 'active', latitude: 17.4208, longitude: 78.448058, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-14', mid: 'A2-18', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjara Hills, Opp:Oman hospital', direction: 'Towards Mehdipatnam', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4162, longitude: 78.424159, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-15', mid: 'A2-33', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjarahills Road No 3 Opp. TVS', direction: 'Towards Punjagutta', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4150, longitude: 78.435747, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-16', mid: '13991', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjarahills road no 1 Masab tank,Near flyover', direction: 'Towards Mehdipatnam', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4082, longitude: 78.452211, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-17', mid: '15946', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjarahills Road No:10, LAS OfficerQTR', direction: 'Towards Punjagutta', dimensions: "25' x 12'", width1: 25, height1: 12, sqft: 161.00, light: 'BackLit', status: 'active', latitude: 17.4178, longitude: 78.436625, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
    { id: 'asset-18', mid: '16289', ownership: 'own', media: 'Hoarding', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Banjara Hills', location: 'Banjarahills Road No:10, Zaher Nagar', direction: 'Towards Mehdipatnam', dimensions: "25' x 10'", width1: 25, height1: 9.5, sqft: 153.50, light: 'BackLit', status: 'active', latitude: 17.4188, longitude: 78.43925, baseRate: 35000, cardRate: 50000, imageUrls: ['https://placehold.co/600x400.png'] },
];
