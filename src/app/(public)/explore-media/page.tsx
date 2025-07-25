
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LocationCard } from '@/components/home/location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function ExploreMediaPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('');
  const [minSqftFilter, setMinSqftFilter] = useState<string>('');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const assetsCollection = collection(db, 'media_assets');
        const q = query(assetsCollection, where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetchedAssets = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
        setAllAssets(fetchedAssets);
      } catch (error) {
        console.error("Error fetching media assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const stateMatch = stateFilter ? asset.state === stateFilter : true;
      const cityMatch = cityFilter ? asset.city === cityFilter : true;
      const mediaTypeMatch = mediaTypeFilter ? asset.media === mediaTypeFilter : true;
      const sqftMatch = minSqftFilter ? (asset.sqft || 0) >= parseInt(minSqftFilter, 10) : true;
      return stateMatch && cityMatch && mediaTypeMatch && sqftMatch;
    });
  }, [allAssets, stateFilter, cityFilter, mediaTypeFilter, minSqftFilter]);

  const uniqueStates = useMemo(() => [...new Set(allAssets.map(a => a.state).filter(Boolean))], [allAssets]);
  const uniqueCities = useMemo(() => {
      if (!stateFilter) return [];
      return [...new Set(allAssets.filter(a => a.state === stateFilter).map(a => a.city).filter(Boolean))];
  }, [allAssets, stateFilter]);
  const uniqueMediaTypes = useMemo(() => [...new Set(allAssets.map(a => a.media).filter(Boolean))], [allAssets]);

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Explore Our Inventory</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find the perfect location for your next campaign. Use the filters below to narrow down your search.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
            <Select value={stateFilter} onValueChange={(value) => {setStateFilter(value); setCityFilter('');}}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {uniqueStates.map(state => <SelectItem key={state} value={state!}>{state}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={(value) => setCityFilter(value)} disabled={!stateFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by City" />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="">All Cities</SelectItem>
                    {uniqueCities.map(city => <SelectItem key={city} value={city!}>{city}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={mediaTypeFilter} onValueChange={(value) => setMediaTypeFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Media Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Media Types</SelectItem>
                    {uniqueMediaTypes.map(type => <SelectItem key={type} value={type!}>{type}</SelectItem>)}
                </SelectContent>
            </Select>
            <Input 
                type="number"
                placeholder="Minimum Sqft"
                value={minSqftFilter}
                onChange={(e) => setMinSqftFilter(e.target.value)}
                className="w-full md:w-[180px]"
            />
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAssets.map((location) => (
            <LocationCard
              key={location.id}
              id={location.id}
              title={location.area || 'Untitled'}
              location={`${location.location}, ${location.city}`}
              imageUrl={location.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
              aiHint="city street billboard"
              description={`A premium ${location.media || 'asset'} facing ${location.direction || 'N/A'}.`}
              category={`${location.dimensions} (${location.sqft} sqft)`}
            />
          ))}
        </div>
      )}
       { !loading && filteredAssets.length === 0 && (
            <div className="text-center col-span-full py-16">
                <p className="text-lg text-muted-foreground">No media assets match your current filters.</p>
            </div>
        )}
    </div>
  );
}
