
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import { MediaPlan } from '@/types/media-plan';
import { format } from 'date-fns';

export function MediaPlansManager() {
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MediaPlan | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const mediaPlansCollectionRef = collection(db, 'media_plans');

  // Sample data to be replaced with Firestore fetching
  const sampleData: MediaPlan[] = [
    {
        id: 'plan-001',
        planId: 'P-2024-001',
        displayName: 'Summer Sale Campaign',
        customer: 'Nike',
        status: 'Draft',
        startDate: new Date('2024-07-01').toISOString(),
        endDate: new Date('2024-07-31').toISOString(),
    },
    {
        id: 'plan-002',
        planId: 'P-2024-002',
        displayName: 'New Product Launch',
        customer: 'Apple',
        status: 'Confirmed',
        startDate: new Date('2024-08-01').toISOString(),
        endDate: new Date('2024-08-31').toISOString(),
    }
  ];

  useEffect(() => {
    // In a real app, you would fetch from Firestore here.
    // For now, we are using sample data.
    // const getMediaPlans = async () => {
    //   setLoading(true);
    //   const data = await getDocs(mediaPlansCollectionRef);
    //   setMediaPlans(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as MediaPlan)));
    //   setLoading(false);
    // };
    // getMediaPlans();
    
    setMediaPlans(sampleData);
    setLoading(false);

  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const planData: any = Object.fromEntries(formData.entries());
    
    if (status) {
      planData.status = status;
    }
    
    // Add dates if they exist
    planData.startDate = new Date().toISOString();
    planData.endDate = new Date().toISOString();


    if (currentPlan) {
      // Update logic
      // const planDoc = doc(db, 'media_plans', currentPlan.id);
      // await updateDoc(planDoc, planData);
      setMediaPlans(mediaPlans.map(plan => plan.id === currentPlan.id ? { ...plan, ...planData, id: currentPlan.id } : plan));
      toast({ title: 'Plan Updated!', description: 'The media plan has been successfully updated.' });
    } else {
      // Add logic
      // const docRef = await addDoc(mediaPlansCollectionRef, planData);
      const newPlan = { ...planData, id: `plan-${Math.random()}` };
      setMediaPlans([...mediaPlans, newPlan]);
      toast({ title: 'Plan Added!', description: 'The new media plan has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (plan: MediaPlan | null = null) => {
    setCurrentPlan(plan);
    setStatus(plan?.status);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentPlan(null);
    setStatus(undefined);
  };
  
  const handleDelete = async (plan: MediaPlan) => {
     // const planDoc = doc(db, 'media_plans', plan.id);
     // await deleteDoc(planDoc);
     setMediaPlans(mediaPlans.filter(p => p.id !== plan.id));
     toast({ title: 'Plan Deleted', description: `${plan.displayName} has been removed.` });
  };
  
  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Media Plans</h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2" />
          Add New Plan
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaPlans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.planId}</TableCell>
                <TableCell>{plan.displayName}</TableCell>
                <TableCell>{plan.customer}</TableCell>
                <TableCell>{plan.status}</TableCell>
                <TableCell>{format(new Date(plan.startDate), 'PPP')}</TableCell>
                <TableCell>{format(new Date(plan.endDate), 'PPP')}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => console.log('View', plan.id)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDialog(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentPlan ? 'Edit Media Plan' : 'Add New Media Plan'}</DialogTitle>
            <DialogDescription>
              {currentPlan ? 'Update the details for this media plan.' : 'Fill in the details for the new media plan.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="planId">Plan ID</Label>
                <Input id="planId" name="planId" defaultValue={currentPlan?.planId} />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" defaultValue={currentPlan?.displayName} required />
              </div>
               <div>
                <Label htmlFor="customer">Customer</Label>
                <Input id="customer" name="customer" defaultValue={currentPlan?.customer} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                 <Select onValueChange={setStatus} defaultValue={currentPlan?.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

