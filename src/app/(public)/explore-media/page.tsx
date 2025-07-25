
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LocationCard } from '@/components/home/location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

function ExploreSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <Skeleton className="h-56 w-full" />
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}


export default function ExploreMediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'mediaAssets'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetchedAssets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        setAssets(fetchedAssets);
      } catch (error) {
        console.error("Error fetching assets: ", error);
        // Handle error, e.g., show a toast message
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesText = filter ? 
        asset.name?.toLowerCase().includes(filter.toLowerCase()) || 
        asset.location?.toLowerCase().includes(filter.toLowerCase()) : true;
      
      const matchesType = mediaTypeFilter !== 'all' ? asset.media === mediaTypeFilter : true;
      
      return matchesText && matchesType;
    });
  }, [assets, filter, mediaTypeFilter]);

  const mediaTypes = useMemo(() => {
      const types = new Set(assets.map(asset => asset.media).filter(Boolean));
      return Array.from(types);
  }, [assets]);

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Explore Our Inventory</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover high-impact advertising locations perfect for your next campaign.
        </p>
      </div>

       <Card className="mb-8">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                <Input 
                    placeholder="Search by name or location..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-grow"
                />
                <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Media Types</SelectItem>
                        {mediaTypes.map(type => (
                             <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

      {loading ? <ExploreSkeleton /> : (
          filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAssets.map((asset) => (
                <LocationCard 
                    key={asset.id}
                    id={asset.id}
                    title={asset.name || 'Untitled'}
                    location={asset.location || 'Unknown Location'}
                    imageUrl={asset.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                    aiHint="city street billboard"
                    description={`A premium ${asset.media || 'asset'} available for booking.`}
                    category={`₹${(asset.rate || 0).toLocaleString('en-IN')}/month`}
                />
                ))}
            </div>
          ) : (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No media assets found matching your criteria.</p>
                </CardContent>
            </Card>
          )
      )}
    </div>
  );
}
