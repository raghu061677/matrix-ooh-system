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
import { ChevronLeft, MoreVertical, Edit, Trash2, Ban, Copy, Share, List, Link as LinkIcon, Download, FileText, Send } from 'lucide-react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { Customer, User } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { SelectAssetsDialog } from './select-assets-dialog';
import { Asset, sampleAssets } from './media-manager-types';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { db, storage } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ExportDownloadLinks } from './export-download-links';

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

// Helper function to upload a file to Firebase Storage and return its URL
async function uploadFileAndGetURL(planId: string, fileBlob: Blob, fileName: string) {
  const exportRef = ref(storage, `exports/plans/${planId}/${fileName}`);
  const snapshot = await uploadBytes(exportRef, fileBlob);
  return await getDownloadURL(snapshot.ref);
}


export function MediaPlanView({ plan: initialPlan, customers, employees }: MediaPlanViewProps) {
  const [plan, setPlan] = React.useState<MediaPlan>(initialPlan);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = React.useState(false);
  const [pdfTemplate, setPdfTemplate] = React.useState('classic');
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchPlanData = async () => {
        const planDocRef = doc(db, 'plans', initialPlan.id);
        const planDoc = await getDoc(planDocRef);
        if (planDoc.exists()) {
            const data = planDoc.data();
            setPlan({
                ...data,
                id: planDoc.id,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                createdAt: data.createdAt?.toDate(),
            } as MediaPlan);
        } else {
             setPlan(initialPlan);
        }
    };
    fetchPlanData();
  }, [initialPlan]);


  const handlePlanUpdate = (updatedPlan: Partial<MediaPlan>) => {
    // In a real app, this would also save to Firestore
    setPlan(prev => ({...prev, ...updatedPlan} as MediaPlan));
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
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
    } catch (error) {
      console.error(`Error converting image to base64: ${url}`, error);
      // Return a placeholder or handle the error as needed
      return ''; 
    }
  }

  const exportPlanToPPT = async () => {
    toast({ title: 'Generating PPT...', description: 'Please wait.' });
    const ppt = new PptxGenJS();
    ppt.author = "Matrix-OOH App";

    const planId = plan.id;
    const planSnap = await getDoc(doc(db, "plans", planId));
    if (!planSnap.exists()) {
      toast({variant: "destructive", title: "Plan not found"});
      return;
    }
    const planData = planSnap.data();
    const assets = (planData as any).mediaAssets || sampleAssets.slice(0, 5);

    for (const asset of assets) {
        const slide = ppt.addSlide();

        slide.addText(`Asset ID: ${asset.iid || asset.id}`, { x: 0.5, y: 0.2, fontSize: 14, bold: true });
        slide.addText(`${asset.location}`, { x: 0.5, y: 0.5, fontSize: 12 });


        if (asset.imageUrls && asset.imageUrls.length > 0) {
            for (let i = 0; i < Math.min(2, asset.imageUrls.length); i++) {
                try {
                    const base64Image = await imageToBase64(asset.imageUrls[i]);
                    if (base64Image) {
                         slide.addImage({ data: base64Image, x: 0.5 + i * 4.5, y: 1.2, w: 4, h: 3 });
                    }
                } catch (err) {
                    console.warn("Image load error:", err);
                }
            }
        }
    }
    
    const pptxBuffer = await ppt.write({ outputType: "buffer" });
    const blob = new Blob([pptxBuffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    
    const filename = `Preview Deck - ${plan.displayName || plan.id}.pptx`;

    try {
        const downloadURL = await uploadFileAndGetURL(planId, blob, filename);
        await updateDoc(doc(db, "plans", planId), {
            "exports.pptUrl": downloadURL,
            "exports.lastGeneratedAt": new Date()
        });
        toast({
          title: 'PPTX Exported Successfully!',
          description: 'The presentation has been saved to Firebase Storage.',
          action: <a href={downloadURL} target="_blank" rel="noopener noreferrer"><Button variant="outline">Open Link</Button></a>,
        });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the PPTX file.' });
       console.error("Upload error:", error);
    }
  };
  
  const exportPlanToExcel = async () => {
      const planId = plan.id;
      const planDoc = await getDoc(doc(db, "plans", planId));
      if (!planDoc.exists()) {
        toast({variant: "destructive", title: "Plan not found"});
        return;
      }
      const planData = planDoc.data();
      const assets = (planData as any).mediaAssets || sampleAssets.slice(0, 5);

      const worksheetData: (string | number)[][] = [
        [
          "S.No", "Location", "Rate", "Printing", "Mounting", "Total", "GST (18%)", "Grand Total"
        ],
      ];

      assets.forEach((asset: any, index: number) => {
        const rate = asset.rate || 0;
        const printing = asset.printingCost || 0;
        const mounting = asset.installationCost || 0;
        const total = rate + printing + mounting;
        const gst = total * 0.18;
        const grandTotal = total + gst;

        worksheetData.push([
          index + 1,
          asset.location,
          rate,
          printing,
          mounting,
          total,
          gst.toFixed(2),
          grandTotal.toFixed(2)
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Media Plan");
      const filename = `plan.xlsx`;

      // Write to Blob
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      try {
        const url = await uploadFileAndGetURL(planId, blob, filename);
        await updateDoc(doc(db, "plans", planId), {
            "exports.excelUrl": url,
            "exports.lastGeneratedAt": new Date()
        });
        toast({
          title: 'Excel Exported Successfully!',
          description: 'The spreadsheet has been saved to Firebase Storage.',
          action: <a href={url} target="_blank" rel="noopener noreferrer"><Button variant="outline">Open Link</Button></a>,
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the Excel file.' });
        console.error("Upload error:", error);
      }
  };

  const exportPlanToPDF = async (templateStyle = 'classic') => {
     toast({ title: 'Generating PDF...', description: 'Please wait while we prepare your work order.' });
     const planId = plan.id;
     const planDocRef = await getDoc(doc(db, "plans", planId));
     if (!planDocRef.exists()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Plan not found.' });
        return;
     }
     const planData = planDocRef.data() as MediaPlan;
     const assets = (planData as any).mediaAssets || sampleAssets.slice(0, 7);
     const customer = customers.find(c => c.id === plan.customerId);

     const pdf = new jsPDF();
      
      const companyName = "Matrix Network Solutions";
      const companyAddress = "H.No: 7-1-19/5/201, Jyothi Bhopal Apartments, Near Begumpet Metro Station, Opp Country Club, Begumpet, Hyderabad 500016, Telangana, India";
      const gstin = "GSTIN: 36AATFM4107H2Z3";
      const pan = "PAN: AATFM4107H";

      if (templateStyle === 'classic') {
        pdf.setFontSize(16);
        pdf.text(companyName, 14, 20);
        pdf.setFontSize(10);
        pdf.text(companyAddress, 14, 26);
        pdf.text(gstin, 14, 31);
        pdf.text(pan, 14, 36);
      }

      pdf.setFontSize(12);
      pdf.text(`Quotation: ${planData.displayName || planId}`, 14, 46);
      pdf.text(`Client: ${customer?.name || 'Client Name'}`, 14, 52);
      if (planData.startDate) {
        pdf.text(`Start Date: ${format(new Date(planData.startDate as any), 'dd MMM yyyy')}`, 14, 58);
      }
       if (planData.endDate) {
        pdf.text(`End Date: ${format(new Date(planData.endDate as any), 'dd MMM yyyy')}`, 14, 64);
      }


      // Table setup
      const body = assets.map((asset: any, index: number) => {
        const rate = asset.cardRate || 0;
        const printing = asset.printingCost || 0;
        const mounting = asset.installationCost || 0;
        const total = rate + printing + mounting;
        const gst = total * 0.18;
        const grandTotal = total + gst;

        return [
          index + 1,
          asset.location || 'N/A',
          rate.toFixed(2),
          printing.toFixed(2),
          mounting.toFixed(2),
          total.toFixed(2),
          gst.toFixed(2),
          grandTotal.toFixed(2)
        ];
      });


      autoTable(pdf, {
        startY: 70,
        head: [[
          "S.No", "Location", "Rate", "Printing", "Mounting", "Total", "GST", "Grand Total"
        ]],
        body,
        theme: templateStyle === 'modern' ? 'grid' : 'striped',
        headStyles: { fillColor: templateStyle === 'modern' ? [41, 128, 185] : [0, 0, 0] }
      });
      
      const finalY = (pdf as any).lastAutoTable.finalY;

      // Footer
      pdf.setFontSize(10);
      pdf.text("Thank you for considering our services!", 14, finalY + 10);

     const blob = pdf.output('blob');
     try {
        const downloadURL = await uploadFileAndGetURL(planId, blob, "quotation.pdf");
        
        await updateDoc(doc(db, "plans", planId), {
            'exports.pdfUrl': downloadURL,
            'exports.lastGeneratedAt': new Date()
        });

        toast({
          title: 'PDF Exported Successfully!',
          description: 'The work order has been saved to Firebase Storage.',
          action: <a href={downloadURL} target="_blank" rel="noopener noreferrer"><Button variant="outline">Open Link</Button></a>,
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the PDF file.' });
        console.error("Upload error:", error);
      }
  };

  const handleSendToClient = async () => {
    toast({ title: 'Generating files...', description: 'Your downloads will begin shortly.' });

    // Generate and download all files first.
    await exportPlanToPPT();
    await exportPlanToExcel();
    await exportPlanToPDF(pdfTemplate);

    // Find client info
    const customer = customers.find(c => c.id === plan.customerId);
    const clientEmail = customer?.email || 'client@example.com';
    const clientName = customer?.name || 'Valued Client';

    // Prepare mailto link
    const subject = encodeURIComponent(`Media Plan Quotation: ${plan.displayName}`);
    const body = encodeURIComponent(`Dear ${clientName},\n\nPlease find the attached media plan proposal (PPT, Excel, and PDF) for your review.\n\nWe look forward to hearing from you.\n\nBest regards,\n\n${plan.employee?.name || 'Your contact at Matrix-OOH'}`);
    
    const mailtoLink = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;

    toast({
        title: 'Ready to Send!',
        description: `Your email client should open. Please attach the downloaded files.`,
        duration: 9000,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/admin/media-plans"><ChevronLeft /></Link>
            </Button>
            <h1 className="text-xl font-bold">
                {plan.projectId} - {customers.find(c => c.id === plan.customerId)?.name} - {plan.displayName}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleConvertToCampaign}>Convert to Campaign</Button>
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
                            <AvatarFallback>{plan.employee?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm text-muted-foreground">Employee</p>
                            <p className="text-sm font-semibold">{plan.employee?.name}</p>
                        </div>
                    </div>
                    <InfoRow label="Start Date" value={plan.startDate ? format(new Date(plan.startDate as any), 'dd MMM yy') : ''} />
                    <InfoRow label="End Date" value={plan.endDate ? format(new Date(plan.endDate as any), 'dd MMM yy') : ''} />
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

            {/* Export Card */}
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Export Plan Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>PDF Template Style</Label>
                        <Select value={pdfTemplate} onValueChange={setPdfTemplate}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classic">Classic (B&W)</SelectItem>
                                <SelectItem value="modern">Modern (Blue)</SelectItem>
                                <SelectItem value="bold">Bold (Future template)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Button onClick={handleSendToClient} variant="default">
                            <Send className="mr-2 h-4 w-4" />
                            Send to Client
                        </Button>
                        <Separator />
                        <Button onClick={exportPlanToPPT} variant="outline">Generate PPT</Button>
                        <Button onClick={exportPlanToExcel} variant="outline">Generate Excel</Button>
                        <Button onClick={() => exportPlanToPDF(pdfTemplate)} variant="outline">Generate PDF (Work Order)</Button>
                    </div>
                </CardContent>
            </Card>
            <ExportDownloadLinks planId={plan.id} />
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
        loading={false}
      />

      <SelectAssetsDialog
        isOpen={isAssetSelectorOpen}
        onOpenChange={setIsAssetSelectorOpen}
        onAddToPlan={handleInventoryUpdate}
      />
    </div>
  );

}
