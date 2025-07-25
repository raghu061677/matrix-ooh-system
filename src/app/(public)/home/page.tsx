
import { Hero } from '@/components/home/hero';
import { Portfolio } from '@/components/home/portfolio';
import { ContactSection } from '@/components/home/contact-section';
import { LocationMap } from '@/components/home/location-map';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Portfolio />
      <LocationMap />
      <ContactSection />
    </>
  );
}
