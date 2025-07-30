
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
    { id: '1', projectId: 'P00109', employee: { id: 'user-001', name: 'Raghu Gajula' }, customerId: 'customer-1', customerName: 'Matrix Network Solutions', displayName: 'CRI', startDate: new Date('2025-07-26'), endDate: new Date('2025-08-24'), days: 30, inventorySummary: { totalSqft: 1048.5 }, costSummary: { grandTotal: 460790 }, statistics: { haMarkupPercentage: 10.14 }, status: 'Draft' },
    { id: '2', projectId: 'P00108', employee: { id: 'user-001', name: 'Raghu Gajula' }, customerId: 'customer-2', customerName: 'Matrix', displayName: 'Matrix ®', startDate: new Date('2025-07-24'), endDate: new Date('2025-08-22'), days: 30, inventorySummary: { totalSqft: 1936.5 }, costSummary: { grandTotal: 800040 }, statistics: { haMarkupPercentage: 10 }, status: 'Draft' },
    { id: '3', projectId: 'P00107', employee: { id: 'user-001', name: 'Raghu Gajula' }, customerId: 'customer-3', customerName: 'Founding Years Learning Solutions Pvt Ltd', displayName: 'Education', startDate: new Date('2025-07-25'), endDate: new Date('2025-10-22'), days: 90, inventorySummary: { totalSqft: 161 }, costSummary: { grandTotal: 194700 }, statistics: { haMarkupPercentage: 10 }, status: 'Confirmed' },
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
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

  const handleCreatePlanFromAssets = (assets: Asset[]) => {
    if (assets.length === 0) {
      toast({ variant: 'destructive', title: 'No assets selected' });
      return;
    }
    setSelectedAssets(assets);
    setIsAssetSelectorOpen(false);
    setIsFormOpen(true);
  };

  const handleSavePlan = async (planData: Partial<MediaPlan>) => {
    setLoading(true);
    if (!user?.companyId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not identified.' });
      setLoading(false);
      return;
    }

    try {
      const newPlanData = {
        ...planData,
        companyId: user.companyId,
        createdAt: serverTimestamp(),
        mediaAssetIds: selectedAssets.map(asset => asset.id),
        mediaAssets: selectedAssets, // Storing full asset data for negotiation page
      };

      const docRef = await addDoc(collection(db, 'plans'), newPlanData);
      toast({ title: 'Plan Created!', description: 'Redirecting to the new plan details...' });
      
      router.push(`/admin/media-plans/${docRef.id}`);

    } catch (error) {
      console.error("Error creating new plan: ", error);
      toast({ variant: 'destructive', title: 'Creation failed', description: 'Could not create the new plan.' });
      setLoading(false);
    }
    setIsFormOpen(false);
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

  
  if (loading && !isAssetSelectorOpen && !isFormOpen) {
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
              Create With AI
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
              <TableHead>Project ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Display</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>SQFT</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>QoS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map(plan => {
               const customer = customers.find(c => c.id === plan.customerId);
               const employee = employees.find(e => e.id === plan.employeeId);
               return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Link href={`/admin/media-plans/${plan.id}`} className="font-medium text-blue-600 hover:underline">
                        {plan.projectId}
                      </Link>
                    </TableCell>
                    <TableCell>{employee?.name || plan.employee?.name}</TableCell>
                    <TableCell>{customer?.name || plan.customerName}</TableCell>
                    <TableCell>{plan.displayName}</TableCell>
                    <TableCell>{plan.startDate ? format(new Date(plan.startDate as any), 'dd MMM yy') : 'N/A'}</TableCell>
                    <TableCell>{plan.endDate ? format(new Date(plan.endDate as any), 'dd MMM yy') : 'N/A'}</TableCell>
                    <TableCell>{plan.days}</TableCell>
                    <TableCell>{plan.inventorySummary?.totalSqft}</TableCell>
                    <TableCell>{plan.costSummary?.grandTotal ? `₹${plan.costSummary.grandTotal.toLocaleString('en-IN')}` : 'N/A'}</TableCell>
                    <TableCell>{plan.statistics?.haMarkupPercentage ? `${plan.statistics.haMarkupPercentage.toFixed(2)}%` : '-'}</TableCell>
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
                    <TableCell colSpan={12} className="text-center text-muted-foreground">No plans found.</TableCell>
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

      <MediaPlanFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        plan={null}
        customers={customers}
        employees={employees}
        onSave={handleSavePlan}
        loading={loading}
      />
    </>
  );
}
