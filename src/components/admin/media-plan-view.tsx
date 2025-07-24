
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaPlan } from '@/types/media-plan';
import { format } from 'date-fns';
import { ChevronLeft, MoreVertical, Edit, Trash2, Ban, Copy, Share, List, Link as LinkIcon, Download, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { Customer, User } from '@/types/firestore';

interface MediaPlanViewProps {
  plan: MediaPlan;
  customers: Customer[];
  employees: User[];
}

const InfoRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className }) => (
    <div className={cn("flex justify-between items-center text-sm py-2", className)}>
        <span className="text-muted-foreground">{label}</span>
        {value !== undefined && value !== null ? <span className="font-medium">{value}</span> : children}
    </div>
);


export function MediaPlanView({ plan: initialPlan, customers, employees }: MediaPlanViewProps) {
  const [plan, setPlan] = React.useState<MediaPlan>(initialPlan);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handlePlanUpdate = (updatedPlan: MediaPlan) => {
    // In a real app, this would also save to Firestore
    setPlan(updatedPlan);
    // Optionally, show a toast notification
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString('en-IN');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/admin/media-plans"><ChevronLeft /></Link>
            </Button>
            <h1 className="text-xl font-bold">
                {plan.projectId} - {plan.customer} - {plan.displayName}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button>Convert to Campaign</Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem><Trash2 className="mr-2" /> Delete</DropdownMenuItem>
                    <DropdownMenuItem><Ban className="mr-2" /> Block</DropdownMenuItem>
                    <DropdownMenuItem><Copy className="mr-2" /> Copy</DropdownMenuItem>
                    <DropdownMenuItem><Share className="mr-2" /> Share</DropdownMenuItem>
                    <DropdownMenuItem><List className="mr-2" /> Activity</DropdownMenuItem>
                    <DropdownMenuItem><LinkIcon className="mr-2" /> Public Link</DropdownMenuItem>
                    <DropdownMenuItem><Download className="mr-2" /> Download PPTx</DropdownMenuItem>
                    <DropdownMenuItem><Download className="mr-2" /> Download Photos</DropdownMenuItem>
                    <DropdownMenuItem><Download className="mr-2" /> Download Excel</DropdownMenuItem>
                    <DropdownMenuItem><FileText className="mr-2" /> Download Work Order</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      
      <main className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Business</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Avatar>
                            <AvatarImage src={plan.employee?.avatar} />
                            <AvatarFallback>{plan.employee?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Employee</p>
                            <p className="text-sm font-semibold">{plan.employee?.name}</p>
                        </div>
                    </div>
                    <InfoRow label="Start Date" value={format(new Date(plan.startDate), 'ddMMMyy')} />
                    <InfoRow label="End Date" value={format(new Date(plan.endDate), 'ddMMMyy')} />
                    <InfoRow label="Days" value={plan.days} />
                </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                     <InfoRow label="Asset Markup">
                        <span className="font-medium text-green-600">
                           {formatCurrency(plan.statistics?.haMarkup)} ({plan.statistics?.haMarkupPercentage}%)
                        </span>
                    </InfoRow>
                    <InfoRow label="Occupancy Wise" value="-" />
                    <InfoRow label="TA Markup">
                         <span className="font-medium text-red-600">
                            {formatCurrency(plan.statistics?.taMarkup)} ({plan.statistics?.taMarkupPercentage}%)
                        </span>
                    </InfoRow>
                    <InfoRow label="ROI on Expense" value="-" />
                </CardContent>
            </Card>

            {/* Inventory Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Inventory</CardTitle>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Home Inventory" value={plan.inventorySummary?.homeCount} />
                    <InfoRow label="Traded Inventory" value={plan.inventorySummary?.rentedCount} />
                    <InfoRow label="Total Sites" value={`${plan.inventorySummary?.totalSites} (${plan.inventorySummary?.totalSites} Units)`} />
                    <InfoRow label="Price / SQFT" value={plan.inventorySummary?.pricePerSqft} />
                    <InfoRow label="Price / SQFT / Month" value={plan.inventorySummary?.pricePerSqftPerMonth} />
                    <Separator className="my-2" />
                    <InfoRow label="Total SQFT" value={plan.inventorySummary?.totalSqft} className="font-bold" />
                </CardContent>
            </Card>

            {/* Client Grade Card */}
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Client Grade A</CardTitle>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Unbilled Sales" value={formatCurrency(plan.clientGrade?.unbilledSales)} />
                    <InfoRow label="Effective Sales" value={formatCurrency(plan.clientGrade?.effectiveSales)} />
                    <InfoRow label="Payment Received" value={formatCurrency(plan.clientGrade?.paymentReceived)} />
                    <InfoRow label="Outstanding" value={formatCurrency(plan.clientGrade?.outstandingSales)} />
                </CardContent>
            </Card>
        </div>
        
        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
             {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Display Cost" value={formatCurrency(plan.costSummary?.displayCost)} />
                    <InfoRow label="Printing Cost" value={formatCurrency(plan.costSummary?.printingCost)} />
                    <InfoRow label="Installation Cost" value={formatCurrency(plan.costSummary?.installationCost)} />
                    <Separator className="my-2"/>
                    <InfoRow label="Total Without Tax" value={formatCurrency(plan.costSummary?.totalBeforeTax)} className="font-semibold"/>
                    <InfoRow label="GST (18%)" value={formatCurrency(plan.costSummary?.gst)} />
                    <Separator className="my-2"/>
                    <InfoRow label="Grand Total" value={formatCurrency(plan.costSummary?.grandTotal)} className="text-lg font-bold" />
                </CardContent>
            </Card>

            {/* Documents Card */}
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Documents</CardTitle>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <InfoRow label="Email Confirmation" value={plan.documents?.emailConfirmations} />
                    <InfoRow label="Purchase Orders" value={plan.documents?.purchaseOrders} />
                    <InfoRow label="Others" value={plan.documents?.others} />
                </CardContent>
            </Card>
        </div>
      </main>
      
      <MediaPlanFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        plan={plan}
        customers={customers}
        employees={employees}
        onSave={(updatedPlan) => {
            handlePlanUpdate(updatedPlan);
            setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
