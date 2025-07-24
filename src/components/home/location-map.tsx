import Image from 'next/image';

export function LocationMap() {
  return (
    <section id="map" className="py-16 md:py-24 bg-secondary/50">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Nationwide Coverage</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our prime locations are strategically placed in major metropolitan areas to maximize your brand's visibility.
          </p>
        </div>
        <div className="relative w-full h-[300px] md:h-[500px] rounded-lg overflow-hidden shadow-xl border">
            <Image
                src="https://placehold.co/1200x600.png"
                alt="Map showing media locations"
                data-ai-hint="city map"
                fill
                className="object-cover"
            />
        </div>
      </div>
    </section>
  );
}
