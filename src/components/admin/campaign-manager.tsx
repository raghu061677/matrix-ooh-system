
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
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
import { MoreHorizontal, Search } from 'lucide-react';
import { Campaign } from '@/types/media-plan';

const sampleCampaigns: Campaign[] = [
    { id: '4', projectId: 'P00106', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerName: 'Matrix Network Solutions', displayName: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), days: 10, inventorySummary: { totalSqft: 1280 }, costSummary: { grandTotal: 224200 }, statistics: { qos: '42.5%' }, status: 'Active' },
];

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(sampleCampaigns);
  const [filter, setFilter] = useState('');

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

  return (
    <div>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
