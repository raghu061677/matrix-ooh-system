
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Search, Zap, CalendarIcon } from 'lucide-react';
import { PowerBill } from '@/types/expenses';
import { Asset } from '@/components/admin/media-manager-types';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

export function PowerBillManager() {
  const [bills, setBills] = useState<PowerBill[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<PowerBill | null>(null);
  const [formData, setFormData] = useState<Partial<PowerBill>>({});
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const billsQuery = query(collection(db, "powerBills"), where("companyId", "==", user.companyId));
      const billsSnapshot = await getDocs(billsQuery);
      setBills(billsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          billDate: doc.data().billDate?.toDate(),
          dueDate: doc.data().dueDate?.toDate(),
          paidDate: doc.data().paidDate?.toDate(),
      } as PowerBill)));
      
      const assetsQuery = query(collection(db, 'mediaAssets'), where('companyId', '==', user.companyId));
      const assetsSnapshot = await getDocs(assetsQuery);
      setAssets(assetsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset)));
    } catch (e) {
      console.error("Error fetching data:", e);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not retrieve power bills or assets.'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: keyof PowerBill, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: keyof PowerBill, date: Date | undefined) => {
     setFormData(prev => ({ ...prev, [name]: date }));
  };
  
  const handleAssetChange = (assetId: string) => {
    const selectedAsset = assets.find(a => a.id === assetId);
    if (selectedAsset) {
        setFormData(prev => ({
            ...prev,
            assetId: selectedAsset.id,
            assetInfo: {
                area: selectedAsset.area,
                location: selectedAsset.location,
            }
        }));
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.companyId) return;
    setLoading(true);

    const dataToSave: Partial<PowerBill> = { ...formData, companyId: user.companyId };

    try {
        if (currentBill) {
            const billDoc = doc(db, 'powerBills', currentBill.id);
            await updateDoc(billDoc, dataToSave);
            toast({ title: 'Bill Updated!', description: 'The power bill has been updated.' });
        } else {
            await addDoc(collection(db, 'powerBills'), { ...dataToSave, createdAt: serverTimestamp() });
            toast({ title: 'Bill Added!', description: 'The new power bill has been added.' });
        }
        await fetchData();
        closeDialog();
    } catch(err) {
        console.error("Save error:", err);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the power bill.'})
    }
    setLoading(false);
  };

  const openDialog = (bill: PowerBill | null = null) => {
    setCurrentBill(bill);
    setFormData(bill || { status: 'Pending' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentBill(null);
    setFormData({});
  };
  
  const handleDelete = async (billId: string) => {
     if (!confirm('Are you sure you want to delete this bill?')) return;
     const billDoc = doc(db, 'powerBills', billId);
     await deleteDoc(billDoc);
     await fetchData();
     toast({ title: 'Bill Deleted', description: `The power bill has been removed.` });
  };

  const filteredBills = useMemo(() => {
    return bills.filter(bill =>
      bill.assetInfo?.location?.toLowerCase().includes(filter.toLowerCase()) ||
      bill.assetInfo?.area?.toLowerCase().includes(filter.toLowerCase()) ||
      bill.serviceNumber?.toLowerCase().includes(filter.toLowerCase()) ||
      bill.meterNumber?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [bills, filter]);

  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const renderForm = () => (
     <form onSubmit={handleSave} className="flex-grow overflow-hidden flex flex-col">
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                <div className="lg:col-span-3">
                    <Label htmlFor="assetId">Media Asset</Label>
                    <Select onValueChange={handleAssetChange} value={formData.assetId}>
                        <SelectTrigger><SelectValue placeholder="Select an asset" /></SelectTrigger>
                        <SelectContent>
                            {assets.map(asset => (
                                <SelectItem key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.location})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Input value={formData.assetInfo?.area || ''} placeholder="Asset Area" disabled />
                <Input value={formData.assetInfo?.location || ''} placeholder="Asset Location" disabled className="md:col-span-2" />

                <Input name="connectionName" value={formData.connectionName || ''} onChange={handleFormChange} placeholder="Name on Connection" required />
                <Input name="meterNumber" value={formData.meterNumber || ''} onChange={handleFormChange} placeholder="Meter No" required />
                <Input name="serviceNumber" value={formData.serviceNumber || ''} onChange={handleFormChange} placeholder="Service No" required />
                
                <Input name="units" type="number" value={formData.units || ''} onChange={handleFormChange} placeholder="Units" required />
                <Input name="arrears" type="number" value={formData.arrears || ''} onChange={handleFormChange} placeholder="Arrears (₹)" />
                <Input name="duePayments" type="number" value={formData.duePayments || ''} onChange={handleFormChange} placeholder="Due Payments (₹)" />
                
                <div>
                  <Label>Bill Date</Label>
                  <Popover>
                      <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2" />{formData.billDate ? format(formData.billDate, 'PPP') : 'Select date'}</Button></PopoverTrigger>
                      <PopoverContent><Calendar mode="single" selected={formData.billDate} onSelect={date => handleDateChange('billDate', date)} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Due Date</Label>
                   <Popover>
                      <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2" />{formData.dueDate ? format(formData.dueDate, 'PPP') : 'Select date'}</Button></PopoverTrigger>
                      <PopoverContent><Calendar mode="single" selected={formData.dueDate} onSelect={date => handleDateChange('dueDate', date)} /></PopoverContent>
                  </Popover>
                </div>

                <Input name="totalDue" type="number" value={formData.totalDue || ''} onChange={handleFormChange} placeholder="Total Due (₹)" required />
                
                <Input name="paidAmount" type="number" value={formData.paidAmount || ''} onChange={handleFormChange} placeholder="Paid Amount (₹)" />

                <div>
                  <Label>Paid Date</Label>
                   <Popover>
                      <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2" />{formData.paidDate ? format(formData.paidDate, 'PPP') : 'Select date'}</Button></PopoverTrigger>
                      <PopoverContent><Calendar mode="single" selected={formData.paidDate} onSelect={date => handleDateChange('paidDate', date)} /></PopoverContent>
                  </Popover>
                </div>
                
                 <div>
                    <Label>Status</Label>
                     <Select onValueChange={(value) => handleSelectChange('status', value as any)} value={formData.status}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
        </DialogFooter>
     </form>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Zap />Power Bills</h1>
        <div className="flex items-center gap-2">
           <Input placeholder="Filter bills..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
           <Button onClick={() => openDialog()}><PlusCircle className="mr-2" />Add New Bill</Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Location</TableHead>
              <TableHead>Bill Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.map(bill => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.assetInfo?.location}</TableCell>
                <TableCell>{bill.billDate ? format(bill.billDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>{bill.dueDate ? format(bill.dueDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>₹{bill.totalDue?.toLocaleString('en-IN')}</TableCell>
                <TableCell><Badge variant={bill.status === 'Paid' ? 'default' : bill.status === 'Pending' ? 'secondary' : 'destructive'}>{bill.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(bill)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(bill.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
             {filteredBills.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No power bills found.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentBill ? 'Edit Power Bill' : 'Add New Power Bill'}</DialogTitle>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>
    </>
  );
}
