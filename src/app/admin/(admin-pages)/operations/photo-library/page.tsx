import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { sampleAssets } from '@/components/admin/media-manager-types';

export default function PhotoLibraryPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ImageIcon />
                Photo Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
                This is a central repository for all campaign-related photos, including geo-tagged images, newspaper clippings, and traffic shots.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sampleAssets.map(asset => (
                <div key={asset.id} className="group relative aspect-square overflow-hidden rounded-lg">
                  <Image 
                    src={asset.imageUrls?.[0] || 'https://placehold.co/400x400.png'}
                    alt={asset.location || 'Media Asset'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-2 text-white">
                      <p className="text-xs font-bold">{asset.area}</p>
                      <p className="text-xs text-white/80 truncate">{asset.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
