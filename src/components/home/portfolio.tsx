
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LocationCard } from './location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';

export function Portfolio() {
  const [locations, setLocations] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assetsCollection = collection(db, 'media_assets');
        // Fetch a limited number of assets for the homepage portfolio
        const q = query(assetsCollection, where('status', '==', 'active'), limit(6));
        const querySnapshot = await getDocs(q);
        const fetchedAssets = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
        setLocations(fetchedAssets);
      } catch (error) {
        console.error("Error fetching media assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return (
    <section id="portfolio" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Premier Media Locations</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore a selection of our high-demand advertising assets across the country.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
             Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-4">
                    <Skeleton className="h-56 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                </div>
            ))
          ) : (
            locations.map((location) => (
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
            ))
          )}
        </div>
         <div className="mt-12 text-center">
            <Button size="lg" asChild>
                <Link href="/explore-media">Explore All Locations</Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
