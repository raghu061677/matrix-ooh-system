
'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseApp } from '@/lib/firebase';
import Image from 'next/image';
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
import { Projector, LayoutGrid, ListChecks, FileText, LogOut, Loader2, Home, Users, ReceiptText, FilePieChart, AreaChart, Dot, ChevronDown, Wrench, Package, Image as ImageIcon, Zap, Printer, Fuel, Building, Settings } from 'lucide-react';
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
  
  // State for collapsible sidebar sections
  const [mediaOpen, setMediaOpen] = useState(pathname.startsWith('/admin/media'));
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith('/admin/reports'));
  const [expensesOpen, setExpensesOpen] = useState(pathname.startsWith('/admin/expenses'));
  const [salesOpen, setSalesOpen] = useState(pathname.startsWith('/admin/sales'));
  const [operationsOpen, setOperationsOpen] = useState(pathname.startsWith('/admin/operations'));


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
               <Image src="/logo.png" alt="Matrix-OOH Logo" width={140} height={40} className="dark:brightness-0 dark:invert" />
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

             <Collapsible open={mediaOpen} onOpenChange={setMediaOpen} className="w-full">
              <SidebarGroup>
                  <SidebarGroupLabel>Media</SidebarGroupLabel>
                  <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <Projector />
                              <span className="whitespace-nowrap">Media</span>
                              <ChevronDown className={cn("ml-auto transition-transform", mediaOpen && "rotate-180")}/>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                      </SidebarMenu>
                  </SidebarGroupContent>
              </SidebarGroup>
              <CollapsibleContent>
                  <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/media-assets')}>
                           <Link href="/admin/media-assets">
                            <LayoutGrid />
                            <span className="whitespace-nowrap">Media Assets</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                       <SidebarMenuSubItem>
                         <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/media-plans')}>
                           <Link href="/admin/media-plans">
                            <FileText />
                            <span className="whitespace-nowrap">Media Plans</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                       <SidebarMenuSubItem>
                         <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/campaigns')}>
                           <Link href="/admin/campaigns">
                            <ListChecks />
                            <span className="whitespace-nowrap">Campaigns</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={salesOpen} onOpenChange={setSalesOpen} className="w-full">
              <SidebarGroup>
                  <SidebarGroupLabel>Sales</SidebarGroupLabel>
                  <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <ReceiptText />
                              <span className="whitespace-nowrap">Sales</span>
                              <ChevronDown className={cn("ml-auto transition-transform", salesOpen && "rotate-180")}/>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                      </SidebarMenu>
                  </SidebarGroupContent>
              </SidebarGroup>
              <CollapsibleContent>
                  <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/customers')}>
                           <Link href="/admin/customers">
                            <Users />
                            <span className="whitespace-nowrap">Customers</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                       <SidebarMenuSubItem>
                         <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/sales-estimates')}>
                           <Link href="/admin/sales-estimates">
                            <FilePieChart />
                            <span className="whitespace-nowrap">Sales Estimates</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                       <SidebarMenuSubItem>
                         <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/purchase-orders')}>
                           <Link href="/admin/purchase-orders">
                            <FileText />
                            <span className="whitespace-nowrap">Purchase Orders</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                       <SidebarMenuSubItem>
                         <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/invoices')}>
                           <Link href="/admin/invoices">
                            <ReceiptText />
                            <span className="whitespace-nowrap">Invoices</span>
                           </Link>
                         </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen} className="w-full">
               <SidebarGroup>
                  <SidebarGroupLabel>Operations</SidebarGroupLabel>
                   <SidebarGroupContent>
                       <SidebarMenu>
                         <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <Wrench />
                              <span className="whitespace-nowrap">Operations</span>
                              <ChevronDown className={cn("ml-auto transition-transform", operationsOpen && "rotate-180")}/>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                      </SidebarMenu>
                   </SidebarGroupContent>
               </SidebarGroup>
               <CollapsibleContent>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem>
                       <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/operations/mounting-tasks')}>
                         <Link href="/admin/operations/mounting-tasks">
                          <Wrench />
                          <span className="whitespace-nowrap">Mounting Tasks</span>
                         </Link>
                       </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                       <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/operations/flex-stock')}>
                         <Link href="/admin/operations/flex-stock">
                          <Package />
                          <span className="whitespace-nowrap">Flex Stock</span>
                         </Link>
                       </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                       <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/operations/photo-library')}>
                         <Link href="/admin/operations/photo-library">
                          <ImageIcon />
                          <span className="whitespace-nowrap">Photo Library</span>
                         </Link>
                       </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
               </CollapsibleContent>
            </Collapsible>
            
            <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen} className="w-full">
              <SidebarGroup>
                  <SidebarGroupLabel>Expenses</SidebarGroupLabel>
                  <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <ReceiptText />
                              <span className="whitespace-nowrap">Expenses</span>
                              <ChevronDown className={cn("ml-auto transition-transform", expensesOpen && "rotate-180")}/>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                      </SidebarMenu>
                  </SidebarGroupContent>
              </SidebarGroup>
               <CollapsibleContent>
                   <SidebarMenuSub>
                         <SidebarMenuSubItem>
                           <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/expenses/power-bills')}>
                             <Link href="/admin/expenses/power-bills">
                              <Zap />
                              <span className="whitespace-nowrap">Power Bills</span>
                             </Link>
                           </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                           <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/expenses/printing')}>
                             <Link href="/admin/expenses/printing">
                              <Printer />
                              <span className="whitespace-nowrap">Printing</span>
                             </Link>
                           </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                           <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/expenses/mounting')}>
                             <Link href="/admin/expenses/mounting">
                              <Wrench />
                              <span className="whitespace-nowrap">Mounting</span>
                             </Link>
                           </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                           <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/expenses/travel')}>
                             <Link href="/admin/expenses/travel">
                              <Fuel />
                              <span className="whitespace-nowrap">Travel</span>
                             </Link>
                           </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                           <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/expenses/office')}>
                             <Link href="/admin/expenses/office">
                              <Building />
                              <span className="whitespace-nowrap">Office</span>
                             </Link>
                           </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
               </CollapsibleContent>
            </Collapsible>


             <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
                <SidebarGroup>
                    <SidebarGroupLabel>Reports</SidebarGroupLabel>
                    <SidebarGroupContent>
                    <SidebarMenu>
                       <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <FilePieChart />
                            <span className="whitespace-nowrap">Reports</span>
                             <ChevronDown className={cn("ml-auto transition-transform", reportsOpen && "rotate-180")}/>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                    </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/reports/availability')}>
                            <Link href="/admin/reports/availability">
                            <Dot />
                            <span>Availability Report</span>
                            </Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/admin/reports/financial')}>
                            <Link href="/admin/reports/financial">
                            <AreaChart />
                            <span className="whitespace-nowrap">Financial Reports</span>
                            </Link>
                        </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </CollapsibleContent>
             </Collapsible>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                        <Link href="/admin/users">
                          <Users />
                          <span>Users</span>
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
