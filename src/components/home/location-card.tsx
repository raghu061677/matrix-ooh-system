
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

type LocationCardProps = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  aiHint: string;
  description: string;
  category: string;
};

export function LocationCard({
  id,
  title,
  location,
  imageUrl,
  aiHint,
  description,
  category,
}: LocationCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ease-in-out flex flex-col">
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
      <CardContent className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-xl font-headline">{title}</CardTitle>
            <Badge variant={'secondary'}>{category}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
        </CardDescription>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
       <CardFooter className="p-6 pt-0 mt-auto">
        <Button asChild className="w-full">
          <Link href={`/enquiry/${id}`}>Enquire Now →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
