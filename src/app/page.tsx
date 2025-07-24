import { Hero } from '@/components/home/hero';
import { Portfolio } from '@/components/home/portfolio';
import { LocationMap } from '@/components/home/location-map';
import { ContactSection } from '@/components/home/contact-section';

export default function Home() {
  return (
    <>
      <Hero />
      <Portfolio />
      <LocationMap />
      <ContactSection />
    </>
  );
}
