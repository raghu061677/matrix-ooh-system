import { LocationCard } from './location-card';

export const mediaLocations = [
  {
    id: 1,
    title: 'Downtown Digital Billboard',
    location: 'New York, NY',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'city street billboard',
    description: 'A premium digital screen in the heart of the city, reaching thousands of commuters daily.',
    category: 'Digital'
  },
  {
    id: 2,
    title: 'Highway 101 Showcase',
    location: 'San Francisco, CA',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'highway billboard sunny',
    description: 'Capture the attention of Silicon Valley traffic with this large-format static billboard.',
    category: 'Static'
  },
  {
    id: 3,
    title: 'Urban Transit Shelter',
    location: 'Chicago, IL',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'bus stop advertising',
    description: 'Engage with pedestrians and public transit users at a high-traffic urban hub.',
    category: 'Transit'
  },
  {
    id: 4,
    title: 'Shopping Mall Media Wall',
    location: 'Los Angeles, CA',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'shopping mall digital',
    description: 'A stunning video wall located at the entrance of a luxury shopping destination.',
    category: 'Digital'
  },
  {
    id: 5,
    title: 'Airport Concourse Display',
    location: 'Atlanta, GA',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'airport advertising screen',
    description: 'Connect with a global audience of travelers in one of the world\'s busiest airports.',
    category: 'Digital'
  },
  {
    id: 6,
    title: 'Iconic Wallscape Mural',
    location: 'Miami, FL',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'building mural art',
    description: 'A massive, hand-painted wallscape in a trendy, arts-focused neighborhood.',
    category: 'Static'
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
          {mediaLocations.map((location) => (
            <LocationCard key={location.id} {...location} />
          ))}
        </div>
      </div>
    </section>
  );
}
