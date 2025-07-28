
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, DocumentData } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, FileText, MoreHorizontal, Bot } from 'lucide-react';
import { MediaPlan } from '@/types/media-plan';
import { Customer, User } from '@/types/firestore';
import { format } from 'date-fns';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { SelectAssetsDialog } from './select-assets-dialog';
import { Asset } from './media-manager-types';

const sampleData: MediaPlan[] = [
    { id: '1', customerId: 'customer-1', displayName: 'CRI Campaign', createdAt: new Date(), startDate: new Date('2025-07-26'), endDate: new Date('2025-08-24'), status: 'Draft', costSummary: { displayCost: 0, printingCost: 0, installationCost: 0, totalBeforeTax: 380000, gst: 68400, grandTotal: 448400 } },
    { id: '2', customerId: 'customer-2', displayName: 'Matrix Launch', createdAt: new Date(), startDate: new Date('2025-07-24'), endDate: new Date('2025-08-22'), status: 'Draft', costSummary: { displayCost: 0, printingCost: 0, installationCost: 0, totalBeforeTax: 500000, gst: 90000, grandTotal: 590000 } },
];

const mockEmployees: User[] = [
    { id: 'user-001', uid: 'user-001', name: 'Raghu Gajula', email: 'raghu@example.com', role: 'admin' },
    { id: 'user-002', uid: 'user-002', name: 'Sunil Reddy', email: 'sunil@example.com', role: 'sales' },
];


export function MediaPlansManager() {
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  const [filter, setFilter] = useState('');

  const { toast } = useToast();
  
  const fetchData = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
        const plansQuery = query(collection(db, "plans"), where("companyId", "==", user.companyId));
        const plansSnapshot = await getDocs(plansQuery);
        if (plansSnapshot.empty) {
            setMediaPlans(sampleData);
        } else {
             const fetchedPlans = plansSnapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                return {
                    ...data,
                    id: doc.id,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                    createdAt: data.createdAt?.toDate(),
                } as MediaPlan;
            });
            setMediaPlans(fetchedPlans);
        }

        const customersQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
        const customersSnapshot = await getDocs(customersQuery);
        setCustomers(customersSnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Customer)));
        
        // Using mock employees for now
        setEmployees(mockEmployees);

    } catch (error) {
        console.error("Error fetching data:", error);
        toast({
            variant: "destructive",
            title: "Error fetching data",
            description: "Could not retrieve latest data. Using samples."
        });
        setMediaPlans(sampleData);
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreatePlanFromAssets = async (selectedAssets: Asset[]) => {
    setIsAssetSelectorOpen(false);
    setLoading(true);
    if (!user?.companyId || !selectedAssets || selectedAssets.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No assets selected or user not identified.' });
      setLoading(false);
      return;
    }

    try {
      const newPlanData = {
        companyId: user.companyId,
        createdAt: serverTimestamp(),
        status: 'Draft',
        displayName: 'New Media Plan',
        mediaAssetIds: selectedAssets.map(asset => asset.id),
        mediaAssets: selectedAssets // Storing full asset data for negotiation page
      };

      const docRef = await addDoc(collection(db, 'plans'), newPlanData);
      toast({ title: 'Plan Created!', description: 'Redirecting to the new plan details...' });
      
      // Redirect to the new plan's negotiation page to continue editing
      router.push(`/admin/media-plans/${docRef.id}`);

    } catch (error) {
      console.error("Error creating new plan: ", error);
      toast({ variant: 'destructive', title: 'Creation failed', description: 'Could not create the new plan.' });
      setLoading(false);
    }
  };
  
  const handleDelete = async (plan: MediaPlan) => {
     const planDoc = doc(db, 'plans', plan.id);
     await deleteDoc(planDoc);
     await fetchData();
     toast({ title: 'Plan Deleted', description: `Plan ${plan.displayName} has been removed.` });
  };
  
  const filteredPlans = useMemo(() => {
    return mediaPlans.filter(plan => {
      const customer = customers.find(c => c.id === plan.customerId);
      const customerName = customer?.name || '';
      const searchTerm = filter.toLowerCase();
      return customerName.toLowerCase().includes(searchTerm) || (plan.status || '').toLowerCase().includes(searchTerm) || (plan.displayName || '').toLowerCase().includes(searchTerm);
    });
  }, [mediaPlans, filter, customers]);

  
  if (loading && !isAssetSelectorOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
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
          <Button variant="outline" asChild>
            <Link href="/admin/ai-planner">
              <Bot className="mr-2" />
              AI Plan
            </Link>
          </Button>
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
              <TableHead>Display Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map(plan => {
               const customer = customers.find(c => c.id === plan.customerId);
               return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Link href={`/admin/media-plans/${plan.id}`} className="font-medium text-blue-600 hover:underline">
                        {customer?.name || plan.customerId || 'N/A'}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {plan.createdAt ? format(new Date(plan.createdAt as any), 'dd MMM yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{plan.displayName}</TableCell>
                    <TableCell>
                        {plan.costSummary?.grandTotal ? `₹${plan.costSummary.grandTotal.toLocaleString('en-IN')}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                        <Badge variant={plan.status === 'Approved' ? 'default' : 'secondary'} className="capitalize">{plan.status}</Badge>
                    </TableCell>
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
               )
            })}
             {filteredPlans.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No plans found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SelectAssetsDialog 
        isOpen={isAssetSelectorOpen}
        onOpenChange={setIsAssetSelectorOpen}
        onAddToPlan={handleCreatePlanFromAssets}
      />
    </>
  );
}
