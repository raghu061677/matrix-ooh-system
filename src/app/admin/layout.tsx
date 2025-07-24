
'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseApp } from '@/lib/firebase';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Projector, LayoutGrid, ListChecks, FileText, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dark bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={cn("flex min-h-screen", "dark bg-background")}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
               <Projector className="h-6 w-6 text-primary" />
               <h2 className="text-lg font-bold font-headline">Matrix Network</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={pathname === '/admin/media-assets'}>
                   <Link href="/admin/media-assets">
                    <LayoutGrid />
                    <span>Media Assets</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={pathname === '/admin/media-plans'}>
                   <Link href="/admin/media-plans">
                    <FileText />
                    <span>Media Plans</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={pathname === '/admin/campaigns'}>
                   <Link href="/admin/campaigns">
                    <ListChecks />
                    <span>Campaigns</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
             </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between p-4 border-b">
             <SidebarTrigger />
             <h1 className="text-xl font-semibold capitalize">
                {pathname.split('/').pop()?.replace('-', ' ')}
             </h1>
          </header>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
