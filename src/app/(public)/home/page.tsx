
import { Hero } from '@/components/home/hero';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Explore Our Vast Network of Media Locations</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                From bustling city centers to high-traffic highways, find the perfect canvas for your brand's message. Our portfolio features a diverse range of high-impact advertising assets ready to bring your vision to life.
            </p>
            <Button size="lg" asChild className="mt-8">
                <Link href="/explore-media">Browse All Locations</Link>
            </Button>
        </div>
      </section>
    </>
  );
}
