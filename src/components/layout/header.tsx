
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { href: '/explore-media', label: 'Explore Media' },
  { href: '/home#contact', label: 'Contact Us' },
  { href: '/login', label: 'Login' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/home" className="mr-6 flex items-center space-x-2">
          <Image src="/logo.png" alt="Matrix-OOH Logo" width={140} height={40} className="dark:brightness-0 dark:invert"/>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end">
           <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between border-b pb-4">
                         <Link href="/home" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                          <Image src="/logo.png" alt="Matrix-OOH Logo" width={140} height={40} className="dark:brightness-0 dark:invert"/>
                        </Link>
                      </div>
                      <nav className="flex flex-col gap-4 mt-6">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-lg font-medium transition-colors hover:text-primary"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          <Button asChild className="hidden md:flex">
            <Link href="/home#contact">Get a Quote</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

    