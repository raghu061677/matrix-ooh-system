import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

type LocationCardProps = {
  title: string;
  location: string;
  imageUrl: string;
  aiHint: string;
  description: string;
  category: string;
};

export function LocationCard({
  title,
  location,
  imageUrl,
  aiHint,
  description,
  category,
}: LocationCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ease-in-out">
      <CardHeader className="p-0">
        <div className="relative h-56 w-full">
          <Image
            src={imageUrl}
            alt={`Image of ${title}`}
            data-ai-hint={aiHint}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-xl font-headline">{title}</CardTitle>
            <Badge variant={category === 'Digital' ? 'default' : 'secondary'}>{category}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
        </CardDescription>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
