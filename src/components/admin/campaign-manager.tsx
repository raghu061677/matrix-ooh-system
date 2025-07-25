
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
import { format } from 'date-fns';
import { MoreHorizontal, Search, Download, Loader2 } from 'lucide-react';
import { Campaign } from '@/types/media-plan';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const sampleCampaigns: Campaign[] = [
    { id: '4', planId: 'plan-1', title: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), images: [], status: 'Running' },
    { id: '5', planId: 'plan-2', title: 'KIDO', startDate: new Date('2025-08-01'), endDate: new Date('2025-08-30'), images: [], status: 'Upcoming' },
];

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from Firestore
    setCampaigns(sampleCampaigns);
    setLoading(false);
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign =>
      Object.values(campaign).some(val => 
          String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [campaigns, filter]);
  
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
            placeholder="Filter campaigns..."
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
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                   <Link href={`/admin/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                        {campaign.title}
                    </Link>
                </TableCell>
                <TableCell>{format(new Date(campaign.startDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{format(new Date(campaign.endDate), 'dd MMM yyyy')}</TableCell>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
