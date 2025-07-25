
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { MoreHorizontal, Search, Download, Loader2 } from 'lucide-react';
import { Campaign } from '@/types/media-plan';
import { Asset, sampleAssets } from './media-manager-types';
import { useToast } from '@/hooks/use-toast';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, endBefore, limitToLast, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const PAGE_SIZE = 10;

const sampleCampaigns: Campaign[] = [
    { id: '4', projectId: 'P00106', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerName: 'Matrix-OOH', displayName: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), days: 10, inventorySummary: { totalSqft: 1280 }, costSummary: { grandTotal: 224200 }, statistics: { qos: '42.5%' }, status: 'Active', exportReady: true },
     { id: '5', projectId: 'P00110', employee: { id: 'user-002', name: 'Sunil Reddy', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' }, customerName: 'Founding Years', displayName: 'KIDO', startDate: new Date('2025-08-01'), endDate: new Date('2025-08-30'), days: 30, inventorySummary: { totalSqft: 800 }, costSummary: { grandTotal: 150000 }, statistics: { qos: 'N/A' }, status: 'Pending', exportReady: false },
];

// Helper to fetch an image and convert it to a base64 data URI
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error converting image to base64: ${url}`, error);
    // Return a placeholder or handle the error as needed
    return ''; 
  }
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);

  const fetchCampaigns = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    try {
        const campaignsCollectionRef = collection(db, 'campaigns');
        let q;

        if (direction === 'next' && lastVisible) {
            q = query(campaignsCollectionRef, orderBy('projectId'), startAfter(lastVisible), limit(PAGE_SIZE));
        } else if (direction === 'prev' && firstVisible) {
            q = query(campaignsCollectionRef, orderBy('projectId'), endBefore(firstVisible), limitToLast(PAGE_SIZE));
        } else {
            q = query(campaignsCollectionRef, orderBy('projectId'), limit(PAGE_SIZE));
        }

        const data = await getDocs(q);
        
        if (!data.empty) {
            const dbCampaigns = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Campaign));
            setCampaigns(dbCampaigns);
            setFirstVisible(data.docs[0]);
            setLastVisible(data.docs[data.docs.length - 1]);
            
            const prevSnap = await getDocs(query(campaignsCollectionRef, orderBy('projectId'), endBefore(data.docs[0]), limitToLast(1)));
            setIsFirstPage(prevSnap.empty);

            const nextSnap = await getDocs(query(campaignsCollectionRef, orderBy('projectId'), startAfter(data.docs[data.docs.length-1]), limit(1)));
            setIsLastPage(nextSnap.empty);

        } else if (direction === 'initial') {
            setCampaigns(sampleCampaigns.slice(0, PAGE_SIZE));
            setIsLastPage(sampleCampaigns.length <= PAGE_SIZE);
        }
    } catch (e) {
        console.error("Error fetching campaigns:", e);
        toast({ variant: 'destructive', title: 'Error fetching campaigns' });
        setCampaigns(sampleCampaigns.slice(0, PAGE_SIZE));
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign =>
      Object.values(campaign).some(val => {
          if(typeof val === 'object' && val !== null) {
              return Object.values(val).some(nestedVal => String(nestedVal).toLowerCase().includes(filter.toLowerCase()));
          }
          return String(val).toLowerCase().includes(filter.toLowerCase());
      })
    );
  }, [campaigns, filter]);

  const downloadCampaignPPT = async (campaign: Campaign) => {
    toast({ title: 'Generating PPTX...', description: 'Please wait while we prepare your presentation.' });
    // In a real app, you would fetch assets for the campaign.
    const campaignAssets = sampleAssets.slice(0, 4); 
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    pptx.addSlide().addText(`Campaign Report: ${campaign.displayName}`, { 
      x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 36, bold: true 
    });

    const imagePromises = campaignAssets.flatMap(asset => asset.imageUrls?.map(url => imageToBase64(url)) || []);
    const base64Images = await Promise.all(imagePromises);

    for (let i = 0; i < campaignAssets.length; i += 2) {
      const asset1 = campaignAssets[i];
      const asset2 = campaignAssets[i+1];
      const slide = pptx.addSlide();
      
      slide.addText(`Campaign: ${campaign.displayName} | Dates: ${format(new Date(campaign.startDate), 'dd/MM/yy')} - ${format(new Date(campaign.endDate), 'dd/MM/yy')}`, { x: 0.5, y: 0.25, w: '90%', h: 0.5, fontSize: 12 });

      if (asset1) {
        slide.addText(`Location: ${asset1.location} | Size: ${asset1.dimensions}`, { x: 0.5, y: 0.75, w: 4, h: 0.5, fontSize: 11 });
        if (asset1.imageUrls?.[0]) slide.addImage({ data: await imageToBase64(asset1.imageUrls[0]), x: 0.5, y: 1.25, w: 4, h: 2.25 });
        if (asset1.imageUrls?.[1]) slide.addImage({ data: await imageToBase64(asset1.imageUrls[1]), x: 0.5, y: 3.75, w: 4, h: 2.25 });
      }

      if (asset2) {
         slide.addText(`Location: ${asset2.location} | Size: ${asset2.dimensions}`, { x: 5.5, y: 0.75, w: 4, h: 0.5, fontSize: 11 });
        if (asset2.imageUrls?.[0]) slide.addImage({ data: await imageToBase64(asset2.imageUrls[0]), x: 5.5, y: 1.25, w: 4, h: 2.25 });
        if (asset2.imageUrls?.[1]) slide.addImage({ data: await imageToBase64(asset2.imageUrls[1]), x: 5.5, y: 3.75, w: 4, h: 2.25 });
      }
    }
    
    pptx.writeFile({ fileName: `Campaign-${campaign.displayName}.pptx` });
  };

  const downloadCampaignPDF = async (campaign: Campaign) => {
    toast({ title: 'Generating PDF...', description: 'Please wait while we prepare your document.' });
    const doc = new jsPDF();
    const campaignAssets = sampleAssets.slice(0, 4);

    doc.text(`Campaign Report: ${campaign.displayName}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Customer: ${campaign.customerName}`, 14, 30);
    doc.text(`Dates: ${format(new Date(campaign.startDate), 'dd MMM yyyy')} - ${format(new Date(campaign.endDate), 'dd MMM yyyy')}`, 14, 36);

    let y = 50;
    for (const asset of campaignAssets) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(11);
        doc.text(`Asset: ${asset.location} (${asset.dimensions})`, 14, y);
        y += 8;
        if(asset.imageUrls?.[0]) {
            const imgData = await imageToBase64(asset.imageUrls[0]);
            if (imgData) doc.addImage(imgData, 'PNG', 14, y, 80, 45);
        }
        if(asset.imageUrls?.[1]) {
            const imgData = await imageToBase64(asset.imageUrls[1]);
            if(imgData) doc.addImage(imgData, 'PNG', 100, y, 80, 45);
        }
        y += 55;
    }

    doc.save(`Campaign-${campaign.displayName}.pdf`);
  };

  const downloadCampaignExcel = (campaign: Campaign) => {
    toast({ title: 'Generating Excel...', description: 'Please wait while we prepare your spreadsheet.' });
    const campaignAssets = sampleAssets.slice(0, 4);

    const data = campaignAssets.map(asset => ({
        'IID': asset.mid,
        'Area': asset.area,
        'City': asset.city,
        'Width': asset.width1,
        'Height': asset.height1,
        'SQFT': asset.sqft,
        'Mounting Cost': 1500, // Sample Data
        'Printing Cost': 5000, // Sample Data
        'Asset Cost': asset.baseRate,
        'GST': (asset.baseRate || 0) * 0.18,
        'Total': (asset.baseRate || 0) * 1.18 + 1500 + 5000,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Assets');

    // Formatting would require a more advanced library or more complex setup.
    // This provides the basic data export.
    XLSX.writeFile(workbook, `Campaign-${campaign.displayName}.xlsx`);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <div className="flex items-center gap-2">
           <Input
            placeholder="Filter campaigns on this page..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button><Search className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Display</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.projectId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={campaign.employee?.avatar} />
                      <AvatarFallback>{campaign.employee?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{campaign.employee?.name}</span>
                  </div>
                </TableCell>
                <TableCell>{campaign.customerName}</TableCell>
                <TableCell>
                   <Link href={`/admin/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                        {campaign.displayName}
                    </Link>
                </TableCell>
                <TableCell>{format(new Date(campaign.startDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{format(new Date(campaign.endDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{campaign.days}</TableCell>
                <TableCell>{campaign.status}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem asChild>
                         <Link href={`/admin/campaigns/${campaign.id}`}>
                           View
                         </Link>
                      </DropdownMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className='w-full'>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={!campaign.exportReady}
                              onClick={() => campaign.exportReady && downloadCampaignPPT(campaign)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export to PPT
                            </DropdownMenuItem>
                           </div>
                        </TooltipTrigger>
                        {!campaign.exportReady && <TooltipContent>Campaign not ready for export</TooltipContent>}
                      </Tooltip>
                      <Tooltip>
                         <TooltipTrigger asChild>
                          <div className='w-full'>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={!campaign.exportReady}
                              onClick={() => campaign.exportReady && downloadCampaignPDF(campaign)}>
                               <Download className="mr-2 h-4 w-4" />
                              Export to PDF
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                         {!campaign.exportReady && <TooltipContent>Campaign not ready for export</TooltipContent>}
                      </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                            <div className='w-full'>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                disabled={!campaign.exportReady}
                                onClick={() => campaign.exportReady && downloadCampaignExcel(campaign)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export to Excel
                              </DropdownMenuItem>
                            </div>
                        </TooltipTrigger>
                        {!campaign.exportReady && <TooltipContent>Campaign not ready for export</TooltipContent>}
                      </Tooltip>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div className="flex justify-end items-center gap-2 mt-4">
        <Button
            variant="outline"
            onClick={() => fetchCampaigns('prev')}
            disabled={isFirstPage || loading}
        >
            Previous
        </Button>
        <Button
            variant="outline"
            onClick={() => fetchCampaigns('next')}
            disabled={isLastPage || loading}
        >
            Next
        </Button>
      </div>
    </TooltipProvider>
  );
}
