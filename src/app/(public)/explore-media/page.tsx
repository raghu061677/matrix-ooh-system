
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LocationCard } from '@/components/home/location-card';
import { Asset } from '@/components/admin/media-manager-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function ExploreMediaPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
     return (
        <div className="container py-12 md:py-16 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="container py-12 md:py-16 text-center">
             <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">Please log in to explore our full media inventory and access filtering tools.</p>
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Go to Login
                        </Link>
                    </Button>
                </CardContent>
             </Card>
        </div>
    )
  }
  
  // This part will only be rendered for logged-in users.
  // The original component logic can be placed here in the future if needed.
  return (
    <div className="container py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Explore Our Inventory</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Welcome, {user.name}. You can now explore the media inventory.
        </p>
         <p className="mt-2 text-sm text-muted-foreground">
          (Full inventory filtering and display functionality for authenticated users is under development.)
        </p>
      </div>
       <Card>
        <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Media asset display and filtering coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
