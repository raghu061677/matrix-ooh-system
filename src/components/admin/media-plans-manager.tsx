
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, FileText, MoreHorizontal } from 'lucide-react';
import { MediaPlan } from '@/types/media-plan';
import { Customer } from '@/components/admin/customer-manager';
import { format } from 'date-fns';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { SelectAssetsDialog } from './select-assets-dialog';
import { Asset } from './media-manager-types';

const sampleData: MediaPlan[] = [
      { id: '1', clientId: 'customer-5', status: 'Draft', total: 460790, createdAt: new Date('2025-07-26'), mediaAssetIds: [] },
      { id: '2', clientId: 'customer-1', status: 'Approved', total: 250000, createdAt: new Date('2025-07-24'), mediaAssetIds: [] },
      { id: '3', clientId: 'customer-2', status: 'Rejected', total: 120000, createdAt: new Date('2025-07-25'), mediaAssetIds: [] },
 ];

export function MediaPlansManager() {
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MediaPlan | null>(null);
  
  const [filter, setFilter] = useState('');

  const { toast } = useToast();
  
  useEffect(() => {
    // This would fetch from Firestore in a real app
    setMediaPlans(sampleData);
    setLoading(false);
    
    const getCustomers = async () => {
        const customersCollectionRef = collection(db, 'customers');
        const data = await getDocs(customersCollectionRef);
        setCustomers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Customer)));
    };
    getCustomers();
  }, []);

  const handleSave = (planToSave: MediaPlan) => {
    setLoading(true);
    if (currentPlan) {
      // Update logic
      setMediaPlans(mediaPlans.map(plan => plan.id === currentPlan.id ? planToSave : plan));
      toast({ title: 'Plan Updated!', description: 'The media plan has been successfully updated.' });
    } else {
      // Add new logic
      const newPlan = { ...planToSave, id: `plan-${Math.random()}` };
      setMediaPlans([...mediaPlans, newPlan]);
      toast({ title: 'Plan Added!', description: 'The new media plan has been added.' });
    }
    setLoading(false);
    closePlanForm();
  };

  const openPlanForm = (plan: MediaPlan | null = null) => {
    setCurrentPlan(plan);
    setIsPlanFormOpen(true);
  };

  const closePlanForm = () => {
    setIsPlanFormOpen(false);
    setCurrentPlan(null);
  };

  const handleAssetsSelected = (selectedAssets: Asset[]) => {
    console.log("Selected assets:", selectedAssets);
    setIsAssetSelectorOpen(false);
    openPlanForm();
    // Here you would pass the selected assets to the plan form
  };
  
  const handleDelete = async (plan: MediaPlan) => {
     setMediaPlans(mediaPlans.filter(p => p.id !== plan.id));
     toast({ title: 'Plan Deleted', description: `Plan for ${getCustomerName(plan.clientId)} has been removed.` });
  };
  
  const filteredPlans = useMemo(() => {
    return mediaPlans.filter(plan => {
      const customerName = getCustomerName(plan.clientId).toLowerCase();
      const searchTerm = filter.toLowerCase();
      return customerName.includes(searchTerm) || plan.status.toLowerCase().includes(searchTerm) || plan.id.includes(searchTerm);
    });
  }, [mediaPlans, filter, customers]);

  const getCustomerName = (clientId: string) => {
    return customers.find(c => c.id === clientId)?.name || 'Unknown Client';
  }
  
  if (loading && !isPlanFormOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText />
            Plan List
        </h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter plans..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setIsAssetSelectorOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Plan
          </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Link href={`/admin/media-plans/${plan.id}`} className="font-medium text-blue-600 hover:underline">
                    {getCustomerName(plan.clientId)}
                  </Link>
                </TableCell>
                <TableCell>{format(new Date(plan.createdAt as any), 'dd MMM yyyy')}</TableCell>
                <TableCell>{plan.total?.toLocaleString('en-IN')}</TableCell>
                <TableCell>{plan.status}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem asChild>
                         <Link href={`/admin/media-plans/${plan.id}`}>
                           <Edit className="mr-2 h-4 w-4" />
                           View/Edit
                         </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(plan)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SelectAssetsDialog
        isOpen={isAssetSelectorOpen}
        onOpenChange={setIsAssetSelectorOpen}
        onAddToPlan={handleAssetsSelected}
      />

      <MediaPlanFormDialog 
        isOpen={isPlanFormOpen}
        onOpenChange={setIsPlanFormOpen}
        plan={currentPlan}
        customers={customers}
        onSave={handleSave}
      />
    </TooltipProvider>
  );
}
