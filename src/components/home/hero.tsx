import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-white">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="Hero banner showing a premium media location"
        data-ai-hint="city billboard night"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold tracking-tighter !leading-tight">
          High-Impact Advertising, Unforgettable Locations
        </h1>
        <p className="mt-4 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
          Connect your brand with millions. Matrix Network Solutions offers premium out-of-home advertising spaces that capture attention and drive results.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="#portfolio">Explore Our Portfolio</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="#contact">Request a Quote</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
