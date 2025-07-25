import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Link 
        href="https://wa.me/919900112233?text=Hi! I'm interested in your media assets" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 transition-transform hover:scale-110"
      >
        <WhatsAppIcon className="w-16 h-16" />
        <span className="sr-only">Chat on WhatsApp</span>
      </Link>
      <Footer />
    </div>
  );
}
