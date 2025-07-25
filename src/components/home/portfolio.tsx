
'use client';

import { useState, useEffect } from 'react';
import { LocationCard } from './location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Button } from '../ui/button';
import Link from 'next/link';

// Using static data to avoid permission errors on the public homepage.
const sampleLocations: Asset[] = [
  {
    id: 'sample-1',
    name: 'Jubilee Hills Hoarding',
    location: 'Road No. 36, High-Traffic Junction, Hyderabad',
    media: 'Hoarding',
    status: 'active',
    rate: 120000,
    imageUrls: ['https://placehold.co/600x400.png?text=Prime+Location+1'],
  },
  {
    id: 'sample-2',
    name: 'Koramangala Unipole',
    location: 'Near Sony World Signal, Bengaluru',
    media: 'Unipole',
    status: 'active',
    rate: 95000,
    imageUrls: ['https://placehold.co/600x400.png?text=Prime+Location+2'],
  },
  {
    id: 'sample-3',
    name: 'Bandra Gantry',
    location: 'Linking Road, Shopper\'s Hub, Mumbai',
    media: 'Gantry',
    status: 'active',
    rate: 150000,
    imageUrls: ['https://placehold.co/600x400.png?text=Prime+Location+3'],
  },
];


export function Portfolio() {

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
          {sampleLocations.map((location) => (
              <LocationCard 
                key={location.id}
                id={location.id}
                title={location.name || 'Untitled'}
                location={location.location || 'Unknown Location'}
                imageUrl={location.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                aiHint="city street billboard"
                description={`A premium ${location.media || 'asset'} available for booking.`}
                category={`₹${(location.rate || 0).toLocaleString('en-IN')}/month`}
              />
            ))}
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
