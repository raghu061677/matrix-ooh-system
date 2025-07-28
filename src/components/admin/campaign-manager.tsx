
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
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
import { format, addDays } from 'date-fns';
import { MoreHorizontal, Search, Download, Loader2, ListChecks } from 'lucide-react';
import { Campaign, CampaignStatus } from '@/types/media-plan';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { Customer } from '@/types/firestore';

const sampleCampaigns: Campaign[] = [
    { id: 'camp-1', planId: '1', title: 'City Bus Shelter Campaign', startDate: new Date('2024-08-01'), endDate: addDays(new Date('2024-08-01'), 30), status: 'Running', companyId: 'company-1' },
    { id: 'camp-2', planId: '2', title: 'Tech Park Launch', startDate: new Date('2024-09-01'), endDate: addDays(new Date('2024-09-01'), 30), status: 'Completed', companyId: 'company-1'},
    { id: 'camp-3', planId: '3', title: 'Monsoon Sale Offer', startDate: new Date('2024-06-15'), endDate: addDays(new Date('2024-06-15'), 30), status: 'Completed', companyId: 'company-1' },
];

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();


  useEffect(() => {
    async function fetchData() {
        if (!user?.companyId) return;
        setLoading(true);
        try {
            const campaignsQuery = query(collection(db, "campaigns"), where("companyId", "==", user.companyId));
            const campaignsSnapshot = await getDocs(campaignsQuery);
            if (campaignsSnapshot.empty) {
                setCampaigns(sampleCampaigns);
            } else {
                const fetchedCampaigns = campaignsSnapshot.docs.map(doc => {
                    const data = doc.data() as DocumentData;
                    return {
                        ...data,
                        id: doc.id,
                        startDate: data.startDate?.toDate(),
                        endDate: data.endDate?.toDate(),
                    } as Campaign;
                });
                setCampaigns(fetchedCampaigns);
            }


             const customersQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
             const customersSnapshot = await getDocs(customersQuery);
             setCustomers(customersSnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Customer)));

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                variant: 'destructive',
                title: 'Failed to fetch campaigns',
            });
            setCampaigns(sampleCampaigns);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [user, toast]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign =>
      Object.values(campaign).some(val => 
          String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [campaigns, filter]);
  
  const getStatusVariant = (status: CampaignStatus) => {
    switch (status) {
        case 'Running':
            return 'default';
        case 'Completed':
            return 'secondary';
        case 'Cancelled':
            return 'destructive'
        default:
            return 'outline'
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><ListChecks />Campaigns</h1>
        <div className="flex items-center gap-2">
           <Input
            placeholder="Filter campaigns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
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
                <TableCell className="font-medium">
                    {campaign.title}
                </TableCell>
                <TableCell>{campaign.startDate ? format(new Date(campaign.startDate as any), 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>{campaign.endDate ? format(new Date(campaign.endDate as any), 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusVariant(campaign.status)}
                    className="capitalize"
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem>View Details</DropdownMenuItem>
                       <DropdownMenuItem>Manage Photos</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {filteredCampaigns.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No campaigns found.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
