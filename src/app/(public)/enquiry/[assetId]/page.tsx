
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnquiryForm } from '@/components/home/enquiry-form';
import { Asset } from '@/components/admin/media-manager-types';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

function AssetDetailsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardContent>
        </Card>
    );
}


export default function EnquiryPage() {
    const params = useParams();
    const assetId = params.assetId as string;
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!assetId) return;

        const fetchAsset = async () => {
            setLoading(true);
            try {
                // The collection name is now `mediaAssets`
                const assetDocRef = doc(db, 'mediaAssets', assetId);
                const assetDoc = await getDoc(assetDocRef);
                if (assetDoc.exists()) {
                    setAsset({ id: assetDoc.id, ...assetDoc.data() } as Asset);
                } else {
                    setError('Asset not found.');
                }
            } catch (err) {
                setError('Failed to load asset details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [assetId]);

    return (
        <div className="container py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                   {loading && <AssetDetailsSkeleton />}
                   {error && <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">{error}</p></CardContent></Card>}
                   {asset && (
                       <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Enquiry for: {asset.location}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2">
                                    <MapPin className="w-4 h-4" />
                                    {asset.location}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                                     <Image 
                                        src={asset.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                                        alt={asset.location || 'Media asset'}
                                        fill
                                        className="object-cover"
                                     />
                                </div>
                               <ul className="text-sm space-y-2 text-muted-foreground">
                                   <li><strong>Rate:</strong> ₹{asset.rate?.toLocaleString('en-IN') || 'N/A'} / month</li>
                                   <li><strong>Status:</strong> <span className="capitalize">{asset.status}</span></li>
                                   <li><strong>Ownership:</strong> <span className="capitalize">{asset.ownership || 'N/A'}</span></li>
                               </ul>
                            </CardContent>
                        </Card>
                   )}
                </div>
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-4">Contact Us</h2>
                    <p className="text-muted-foreground mb-6">Please fill out the form below, and we'll get in touch with you shortly regarding this media location.</p>
                    <EnquiryForm asset={asset} />
                </div>
            </div>
        </div>
    );
}
