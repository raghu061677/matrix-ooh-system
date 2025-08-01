
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Matrix-OOH - Premium OOH Advertising Solutions',
  description:
    'Explore premium out-of-home media locations with Matrix-OOH. We offer high-impact advertising opportunities to elevate your brand presence.',
  keywords: [
    'OOH advertising',
    'billboards',
    'media locations',
    'outdoor advertising',
    'Matrix-OOH',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
      >
        {children}
        <Toaster />
        <Script src="https://wati-integration-service.clare.ai/ShopifyWidget/shopifyWidget.js?72920" strategy="lazyOnload" async />
      </body>
    </html>
  );
}
