
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LocationCard } from '@/components/home/location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ExploreMediaPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('');
  const [minSqftFilter, setMinSqftFilter] = useState<string>('');

  // Pre-fetch all assets to populate filter dropdowns
  useEffect(() => {
    const fetchInitialAssets = async () => {
      setLoading(true);
      try {
        const assetsCollection = collection(db, 'media_assets');
        const q = query(assetsCollection, where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetchedAssets = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
        setAllAssets(fetchedAssets);
        setFilteredAssets(fetchedAssets); // Initially, show all
      } catch (error) {
        console.error("Error fetching media assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialAssets();
  }, []);
  
  const handleFilter = async () => {
    setLoading(true);
    try {
        const assetsCollection = collection(db, 'media_assets');
        const constraints: QueryConstraint[] = [where('status', '==', 'active')];

        if (stateFilter) {
            constraints.push(where('state', '==', stateFilter));
        }
        if (cityFilter) {
            constraints.push(where('city', '==', cityFilter));
        }
        if (mediaTypeFilter) {
            constraints.push(where('media', '==', mediaTypeFilter));
        }
        if (minSqftFilter && parseInt(minSqftFilter, 10) > 0) {
            // Firestore doesn't support inequality checks on multiple fields.
            // We'll do the primary filtering on indexed fields and this one on the client.
            // For a large dataset, this would require a different approach (e.g., a search service like Algolia).
        }
        
        const q = query(assetsCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        let fetchedAssets = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
        
        // Client-side filtering for sqft after initial query
        if (minSqftFilter && parseInt(minSqftFilter, 10) > 0) {
            fetchedAssets = fetchedAssets.filter(asset => (asset.sqft || 0) >= parseInt(minSqftFilter, 10));
        }
        
        setFilteredAssets(fetchedAssets);

    } catch (error) {
        console.error("Error filtering assets:", error);
    } finally {
        setLoading(false);
    }
  };


  const uniqueStates = useMemo(() => [...new Set(allAssets.map(a => a.state).filter(Boolean))], [allAssets]);
  const uniqueCities = useMemo(() => {
      if (!stateFilter) return [...new Set(allAssets.map(a => a.city).filter(Boolean))];
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
            <Select value={stateFilter} onValueChange={(value) => {setStateFilter(value === 'all' ? '' : value); setCityFilter('');}}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map(state => <SelectItem key={state} value={state!}>{state}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={(value) => setCityFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by City" />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map(city => <SelectItem key={city} value={city!}>{city}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={mediaTypeFilter} onValueChange={(value) => setMediaTypeFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Media Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Media Types</SelectItem>
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
            <Button onClick={handleFilter} className="w-full md:w-auto">Apply Filters</Button>
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
