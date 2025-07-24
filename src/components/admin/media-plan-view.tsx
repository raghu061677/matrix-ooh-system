
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaPlan } from '@/types/media-plan';
import { format } from 'date-fns';
import { ChevronLeft, MoreVertical, Edit, Trash2, Ban, Copy, Share, List, Link as LinkIcon, Download, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { Customer, User } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { SelectAssetsDialog } from './select-assets-dialog';
import { Asset, sampleAssets } from './media-manager-types';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { db, storage } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

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
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = React.useState(false);
  const { toast } = useToast();

  const handlePlanUpdate = (updatedPlan: MediaPlan) => {
    // In a real app, this would also save to Firestore
    setPlan(updatedPlan);
    toast({ title: 'Plan Updated', description: 'The media plan has been successfully updated.' });
  };
  
  const handleConvertToCampaign = () => {
    // In a real app, this would involve creating a new campaign document in Firestore
    console.log('Converting plan to campaign:', plan.id);
    toast({
        title: 'Plan Converted to Campaign',
        description: `${plan.displayName} is now a campaign.`
    });
  };

  const handleInventoryUpdate = (selectedAssets: Asset[]) => {
    console.log("Updating inventory for plan:", plan.id, "with assets:", selectedAssets);
    // Here you would add the logic to recalculate inventory summaries and costs.
    // For now, we just show a toast.
    toast({
        title: 'Media Assets Selected',
        description: `${selectedAssets.length} assets have been selected. Update logic to be implemented.`,
    });
    setIsAssetSelectorOpen(false);
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString('en-IN');
  };
  
  // Helper to fetch an image and convert it to a base64 data URI
  async function imageToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error converting image to base64: ${url}`, error);
      return ''; 
    }
  }

  const exportPlanToPPT = async () => {
    toast({ title: 'Generating PPTX...', description: 'Please wait while we prepare your presentation.' });
    const pptx = new PptxGenJS();
    pptx.author = "MediaVenue App";

    // In a real app, the plan would have a list of asset IDs.
    // For this example, we'll use a few assets from the sample data.
    const planAssets = sampleAssets.slice(0, 5); // Assuming these assets are in the plan

    for (const asset of planAssets) {
        const slide = pptx.addSlide();

        // Add asset details to the slide
        slide.addText(`Asset ID: ${asset.mid || 'N/A'}`, { x: 0.5, y: 0.25, fontSize: 14, bold: true });
        slide.addText(`Location: ${asset.location || 'N/A'}`, { x: 0.5, y: 0.5, fontSize: 12 });
        slide.addText(`Size: ${asset.dimensions || 'N/A'}`, { x: 0.5, y: 0.75, fontSize: 12 });
        
        // In a real implementation, you would query Firestore for images related to the asset.
        // For demonstration, we'll use the placeholder URLs from sampleAssets.
        const imageUrls = asset.imageUrls || [];

        // Add up to 2 images to the slide
        for (let i = 0; i < Math.min(2, imageUrls.length); i++) {
            const imageUrl = imageUrls[i];
            try {
                // We need to fetch the image and convert it to base64 to embed it in the PPTX
                const imageBase64 = await imageToBase64(imageUrl);
                if (imageBase64) {
                    slide.addImage({ data: imageBase64, x: 0.5 + i * 5.0, y: 1.2, w: 4.5, h: 2.53 });
                }
            } catch (err) {
                console.warn(`Could not load image for asset ${asset.mid}:`, err);
                // Optionally add a placeholder for failed images
                slide.addText('Image not available', { x: 0.5 + i * 5.0, y: 1.2, w: 4.5, h: 2.53, align: 'center', fill: { color: 'F1F1F1' } });
            }
        }
    }

    const filename = `${plan.displayName || 'MediaPlan'}_${plan.id}.pptx`;
    pptx.writeFile({ fileName: filename });
};
  
  const exportPlanToExcel = () => {
    toast({ title: 'Generating Excel...', description: 'Please wait while we prepare your spreadsheet.' });
    const planAssets = sampleAssets.slice(0, 5);
    let totalAmount = 0;

    const data = planAssets.map((asset, index) => {
        const displayCost = asset.baseRate || 0;
        const printingCost = plan.costSummary?.printingCost && planAssets.length > 0 ? plan.costSummary.printingCost / planAssets.length : 0;
        const installationCost = plan.costSummary?.installationCost && planAssets.length > 0 ? plan.costSummary.installationCost / planAssets.length : 0;
        const subTotal = displayCost + printingCost + installationCost;
        const gst = subTotal * 0.18;
        const grandTotal = subTotal + gst;
        totalAmount += grandTotal;

        return {
            'S.No': index + 1,
            'Location': asset.location,
            'City': asset.city,
            'Size': asset.dimensions,
            'Qty': 1,
            'Rate': displayCost,
            'Printing': printingCost,
            'Mounting': installationCost,
            'Total': subTotal,
            'GST': gst,
            'Grand Total': grandTotal,
        };
    });
    
    // Add total row
    data.push({
        'S.No': 'Total',
        'Location': '', 'City': '', 'Size': '', 'Qty': '', 'Rate': '', 'Printing': '', 'Mounting': '', 'Total': '', 'GST': '',
        'Grand Total': totalAmount,
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Plan');
    XLSX.writeFile(workbook, `Plan-${plan.displayName}.xlsx`);
  };

  const exportPlanToPDF = () => {
     toast({ title: 'Generating PDF...', description: 'Please wait while we prepare your work order.' });
     const doc = new jsPDF();
     const customer = customers.find(c => c.id === plan.customerId);

     // Header
     doc.setFontSize(20);
     doc.setFont("helvetica", "bold");
     doc.text("MediaVenue", 14, 22);
     doc.setFontSize(10);
     doc.setFont("helvetica", "normal");
     doc.text("GSTIN: YOUR_GSTIN_HERE", 14, 28);
     doc.text("123 Media Lane, Ad City, HYD 500081", 14, 34);

     // Title
     doc.setFontSize(16);
     doc.setFont("helvetica", "bold");
     doc.text("Work Order / Quotation", 105, 45, { align: "center" });

     // Client Details
     doc.setFontSize(11);
     doc.setFont("helvetica", "normal");
     doc.text(`To: ${customer?.name || plan.customerName}`, 14, 60);
     const address = customer?.addresses?.[0];
     if(address) doc.text(`${address.street}, ${address.city}, ${address.state} ${address.postalCode}`, 14, 66);
     doc.text(`GST: ${customer?.gst || 'N/A'}`, 14, 72);

     // Plan Details
     doc.text(`Campaign: ${plan.displayName}`, 130, 60);
     doc.text(`Start Date: ${format(new Date(plan.startDate), 'dd/MM/yyyy')}`, 130, 66);
     doc.text(`End Date: ${format(new Date(plan.endDate), 'dd/MM/yyyy')}`, 130, 72);
     
     // Table
     const planAssets = sampleAssets.slice(0, 5);
     const tableColumn = ["S.No", "Location", "Size", "Rate", "Total"];
     const tableRows: (string|number)[][] = [];
     planAssets.forEach((asset, index) => {
        const row = [
            index + 1,
            asset.location || 'N/A',
            asset.dimensions || 'N/A',
            formatCurrency(asset.baseRate) || '0',
            formatCurrency(asset.baseRate) || '0'
        ];
        tableRows.push(row);
     });
     
     (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 80,
     });
     
     const finalY = (doc as any).lastAutoTable.finalY;

     // Summary
     doc.text(`Total Before Tax: ${formatCurrency(plan.costSummary?.totalBeforeTax)}`, 140, finalY + 10);
     doc.text(`GST (18%): ${formatCurrency(plan.costSummary?.gst)}`, 140, finalY + 16);
     doc.setFont("helvetica", "bold");
     doc.text(`Grand Total: ${formatCurrency(plan.costSummary?.grandTotal)}`, 140, finalY + 22);

     // Footer
     doc.setFontSize(10);
     doc.setFont("helvetica", "normal");
     doc.text("For MediaVenue", 30, finalY + 50);
     doc.text("Client Signature", 150, finalY + 50);

     doc.save(`WorkOrder-${plan.displayName}.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/admin/media-plans"><ChevronLeft /></Link>
            </Button>
            <h1 className="text-xl font-bold">
                {plan.projectId} - {plan.customerName} - {plan.displayName}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleConvertToCampaign}>Convert to Campaign</Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><Download className="mr-2" /> Export Plan</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={exportPlanToPPT}>
                      <FileText className="mr-2" /> Export as PPT
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportPlanToExcel}>
                      <FileText className="mr-2" /> Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportPlanToPDF}>
                      <FileText className="mr-2" /> Export as PDF Work Order
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsDialogOpen(true)}><Edit className="mr-2" /> Edit Plan Details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><Trash2 className="mr-2" /> Delete</DropdownMenuItem>
                    <DropdownMenuItem><Ban className="mr-2" /> Block</DropdownMenuItem>
                    <DropdownMenuItem><Copy className="mr-2" /> Copy</DropdownMenuItem>
                    <DropdownMenuItem><Share className="mr-2" /> Share</DropdownMenuItem>
                    <DropdownMenuItem><List className="mr-2" /> Activity</DropdownMenuItem>
                    <DropdownMenuItem><LinkIcon className="mr-2" /> Public Link</DropdownMenuItem>
                    <DropdownMenuItem><Download className="mr-2" /> Download Photos</DropdownMenuItem>
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
                    <InfoRow label="Start Date" value={format(new Date(plan.startDate), 'dd MMM yy')} />
                    <InfoRow label="End Date" value={format(new Date(plan.endDate), 'dd MMM yy')} />
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

            {/* Media Assets Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Media Assets</CardTitle>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/media-plans/${plan.id}/negotiation`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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

      <SelectAssetsDialog
        isOpen={isAssetSelectorOpen}
        onOpenChange={setIsAssetSelectorOpen}
        onAddToPlan={handleInventoryUpdate}
      />
    </div>
  );
}
