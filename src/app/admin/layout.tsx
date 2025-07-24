
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
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { Projector, LayoutGrid, ListChecks, FileText, LogOut, Loader2, Home, Users, ReceiptText, FilePieChart, AreaChart, Dot, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeProvider, useTheme } from '@/components/admin/theme-provider';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const pathname = usePathname();
  const { theme } = useTheme();
  const [reportsOpen, setReportsOpen] = useState(false);

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
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={cn('flex min-h-screen', theme !== 'light' && theme)}>
        <Sidebar collapsible="icon">
         <SidebarRail />
          <SidebarHeader>
            <div className="flex items-center gap-2">
               <Projector className="h-6 w-6 text-primary" />
               <h2 className="text-lg font-bold font-headline whitespace-nowrap">Matrix Network</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="pt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} tooltip="Dashboard">
                   <Link href="/admin/dashboard">
                    <Home />
                    <span className="whitespace-nowrap">Dashboard</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

             <SidebarGroup>
                <SidebarGroupLabel>Media</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                       <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname === '/admin/media-assets'} tooltip="Media Assets">
                           <Link href="/admin/media-assets">
                            <LayoutGrid />
                            <span className="whitespace-nowrap">Media Assets</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/media-plans')} tooltip="Media Plans">
                           <Link href="/admin/media-plans">
                            <FileText />
                            <span className="whitespace-nowrap">Media Plans</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/campaigns')} tooltip="Campaigns">
                           <Link href="/admin/campaigns">
                            <ListChecks />
                            <span className="whitespace-nowrap">Campaigns</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
             </SidebarGroup>

             <SidebarGroup>
                <SidebarGroupLabel>Sales</SidebarGroupLabel>
                 <SidebarGroupContent>
                     <SidebarMenu>
                       <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/customers')} tooltip="Customers">
                           <Link href="/admin/customers">
                            <Users />
                            <span className="whitespace-nowrap">Customers</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/quotations')} tooltip="Quotations">
                           <Link href="#">
                            <ReceiptText />
                            <span className="whitespace-nowrap">Quotations</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/invoices')} tooltip="Invoices">
                           <Link href="#">
                            <ReceiptText />
                            <span className="whitespace-nowrap">Invoices</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                 </SidebarGroupContent>
             </SidebarGroup>

             <SidebarGroup>
                <SidebarGroupLabel>Reports</SidebarGroupLabel>
                <SidebarGroupContent>
                  <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
                    <SidebarMenu>
                       <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <FilePieChart />
                            <span className="whitespace-nowrap">Media Reports</span>
                            <ChevronDown className={cn("ml-auto transition-transform", reportsOpen && "rotate-180")}/>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                    </SidebarMenu>
                    <CollapsibleContent>
                       <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <Link href="#">
                                <Dot />
                                <span>Availability Report</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                       </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                  <SidebarMenu>
                      <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/reports/financial')} tooltip="Financial Reports">
                           <Link href="#">
                            <AreaChart />
                            <span className="whitespace-nowrap">Financial Reports</span>
                           </Link>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
             </SidebarGroup>

          </SidebarContent>
          <SidebarFooter>
             <div className="flex items-center justify-between">
                <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
                    <LogOut />
                    <span>Logout</span>
                </Button>
                <ThemeToggle />
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between p-4 border-b">
             <SidebarTrigger />
             <h1 className="text-xl font-semibold capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ')}
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ThemeProvider>
  );
}
