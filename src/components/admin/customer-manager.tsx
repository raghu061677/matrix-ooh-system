
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { Customer } from '@/types/firestore';
import { statesAndDistricts } from '@/lib/india-states';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getGstDetails } from '@/lib/actions';

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isFetchingGst, startGstTransition] = useTransition();

  const { toast } = useToast();
  const customersCollectionRef = collection(db, 'customers');

  useEffect(() => {
    const getCustomers = async () => {
      setLoading(true);
      try {
        const data = await getDocs(customersCollectionRef);
        setCustomers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Customer)));
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
            variant: 'destructive',
            title: 'Error fetching customers',
            description: 'Could not retrieve customer data from the server.'
        });
      } finally {
        setLoading(false);
      }
    };

    getCustomers();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, objectName: 'contactPersons' | 'addresses', index: number) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const updatedArray = [...(prev[objectName] || [])];
        if(!updatedArray[index]) updatedArray[index] = {} as any;
        (updatedArray[index] as any)[name] = value;
        return { ...prev, [objectName]: updatedArray };
    });
  };

  const handleGstFetch = () => {
    const gstNumber = formData.gst;
    if (!gstNumber) {
        toast({
            variant: 'destructive',
            title: 'GST Number required',
            description: 'Please enter a GST number to fetch details.',
        });
        return;
    }
    startGstTransition(async () => {
        const result = await getGstDetails({ gstNumber });
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching GST details',
                description: result.error,
            });
        } else if (result.data) {
            const { legalName, address, city, state, pincode } = result.data;
            setFormData(prev => ({
                ...prev,
                name: legalName,
                addresses: [{
                    type: 'billing',
                    street: address,
                    city: city,
                    state: state,
                    postalCode: pincode,
                }]
            }));
            toast({
                title: 'Details Fetched!',
                description: 'Business name and address have been populated.',
            });
        }
    });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (currentCustomer) {
      const customerDoc = doc(db, 'customers', currentCustomer.id);
      await updateDoc(customerDoc, formData);
      setCustomers(customers.map(customer => customer.id === currentCustomer.id ? { ...customer, ...formData, id: currentCustomer.id } as Customer : customer));
      toast({ title: 'Customer Updated!', description: 'The customer has been successfully updated.' });
    } else {
      const docRef = await addDoc(customersCollectionRef, formData);
      setCustomers([...customers, { ...formData, id: docRef.id } as Customer]);
      toast({ title: 'Customer Added!', description: 'The new customer has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    setFormData(customer || { contactPersons: [{}], addresses: [{ type: 'billing' }] });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentCustomer(null);
    setFormData({});
  };
  
  const handleDelete = async (customer: Customer) => {
     const customerDoc = doc(db, 'customers', customer.id);
     await deleteDoc(customerDoc);
     setCustomers(customers.filter(c => c.id !== customer.id));
     toast({ title: 'Customer Deleted', description: `${customer.name} has been removed.` });
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
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2" />
          Add New Customer
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.code}</TableCell>
                <TableCell>{customer.gst}</TableCell>
                <TableCell>{customer.contactPersons?.[0]?.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(customer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(customer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              
              <div className="md:col-span-2">
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="code">Customer Code</Label>
                <Input id="code" name="code" value={formData.code || ''} onChange={handleFormChange} />
              </div>
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <div className="flex items-center gap-2">
                    <Input id="gst" name="gst" value={formData.gst || ''} onChange={handleFormChange} />
                    <Button type="button" variant="outline" size="icon" onClick={handleGstFetch} disabled={isFetchingGst}>
                        {isFetchingGst ? <Loader2 className="animate-spin" /> : <Search />}
                    </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-medium border-b pb-2 mb-4">Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="contactName">Name</Label>
                        <Input id="contactName" name="name" value={formData.contactPersons?.[0]?.name || ''} onChange={(e) => handleNestedChange(e, 'contactPersons', 0)} />
                    </div>
                    <div>
                        <Label htmlFor="contactPhone">Phone</Label>
                        <Input id="contactPhone" name="phone" value={formData.contactPersons?.[0]?.phone || ''} onChange={(e) => handleNestedChange(e, 'contactPersons', 0)} />
                    </div>
                    <div>
                        <Label htmlFor="contactDesignation">Designation</Label>
                        <Input id="contactDesignation" name="designation" value={formData.contactPersons?.[0]?.designation || ''} onChange={(e) => handleNestedChange(e, 'contactPersons', 0)} />
                    </div>
                </div>
              </div>

              <div className="md:col-span-2">
                 <h3 className="text-lg font-medium border-b pb-2 mb-4">Billing Address</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="street">Street</Label>
                        <Input id="street" name="street" value={formData.addresses?.[0]?.street || ''} onChange={(e) => handleNestedChange(e, 'addresses', 0)} />
                    </div>
                    <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" value={formData.addresses?.[0]?.city || ''} onChange={(e) => handleNestedChange(e, 'addresses', 0)} />
                    </div>
                    <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" value={formData.addresses?.[0]?.state || ''} onChange={(e) => handleNestedChange(e, 'addresses', 0)} />
                    </div>
                     <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" name="postalCode" value={formData.addresses?.[0]?.postalCode || ''} onChange={(e) => handleNestedChange(e, 'addresses', 0)} />
                    </div>
                 </div>
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
