
'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { PlusCircle, Edit, Trash2, Loader2, Search, SlidersHorizontal, ArrowUpDown, Upload, Download } from 'lucide-react';
import { Customer, Address } from '@/types/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { fetchGstDetails } from '@/ai/flows/fetch-gst-details';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

type SortConfig = {
  key: keyof Customer;
  direction: 'ascending' | 'descending';
} | null;

type SearchableField = 'name' | 'gst' | 'email' | 'phone';

const sampleCustomers: Customer[] = [
    { id: 'customer-1', companyId: 'company-1', name: 'Matrix-OOH', gst: '29AAACN1234F1Z5', email: 'contact@matrix.com', phone: '9876543210', billingAddress: { street: '123 Cyberabad', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' } },
    { id: 'customer-2', companyId: 'company-1', name: 'Founding Years Learning', gst: '36ABCFY1234G1Z2', email: 'info@foundingyears.com', phone: '9876543211', billingAddress: { street: '456 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033' } },
];


export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isFetchingGst, startGstTransition] = useTransition();

  const [filter, setFilter] = useState('');
  const [searchField, setSearchField] = useState<SearchableField>('name');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const customersCollectionRef = collection(db, 'customers');
  
  const getCustomers = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
        const q = query(collection(db, "customers"), where("companyId", "==", user.companyId));
        const data = await getDocs(q);
        if(!data.empty) {
            setCustomers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Customer)));
        } else {
             setCustomers(sampleCustomers);
        }
    } catch(e) {
         console.error("Error fetching customers:", e);
         toast({
            variant: 'destructive',
            title: 'Error fetching customers',
            description: 'Could not retrieve customer data. Using sample data.'
        });
        setCustomers(sampleCustomers);
    }
    setLoading(false);
  };

  useEffect(() => {
    getCustomers();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, addressType: 'billingAddress' | 'shippingAddress') => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [addressType]: {
            ...(prev[addressType] || {}),
            [name]: value
        }
    }));
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
        try {
            const result = await fetchGstDetails({ gstNumber });
            if (result) {
                const { legalName, address, city, state, pincode } = result;
                setFormData(prev => ({
                    ...prev,
                    name: legalName,
                    billingAddress: {
                        street: address,
                        city: city,
                        state: state,
                        postalCode: pincode,
                    }
                }));
                toast({
                    title: 'Details Fetched!',
                    description: 'Business Name and address have been populated.',
                });
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error fetching GST details',
                description: 'Failed to fetch GST details. Please try again.',
            });
        }
    });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.companyId) return;
    setLoading(true);

    const dataToSave: Partial<Customer> = { ...formData, companyId: user.companyId };

    if (currentCustomer) {
      const customerDoc = doc(db, 'customers', currentCustomer.id);
      await updateDoc(customerDoc, dataToSave);
      toast({ title: 'Customer Updated!', description: 'The customer has been successfully updated.' });
    } else {
      await addDoc(customersCollectionRef, dataToSave);
      toast({ title: 'Customer Added!', description: 'The new customer has been added.' });
    }
    await getCustomers();
    setLoading(false);
    closeDialog();
  };

  const openDialog = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    const initialFormData = customer || { 
      billingAddress: { street: '', city: ''}, 
      shippingAddress: { street: '', city: ''}
    };
    setFormData(initialFormData);
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
     await getCustomers();
     toast({ title: 'Customer Deleted', description: `${customer.name} has been removed.` });
  };
  
  const sortedAndFilteredCustomers = useMemo(() => {
    let sortableCustomers = [...customers];
    if (filter) {
      sortableCustomers = sortableCustomers.filter(customer => {
        const searchTerm = filter.toLowerCase();
        return customer.name?.toLowerCase().includes(searchTerm) ||
               customer.gst?.toLowerCase().includes(searchTerm) ||
               customer.email?.toLowerCase().includes(searchTerm) ||
               customer.phone?.toLowerCase().includes(searchTerm);
      });
    }
    return sortableCustomers;
  }, [customers, filter]);

  
  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
           <Input
            placeholder="Filter customers..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2" />
            Add New Customer
          </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCustomers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.gst}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
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
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} required />
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
                   <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={formData.email || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleFormChange} />
                  </div>

                  <div className="md:col-span-2">
                     <h3 className="text-lg font-medium border-b pb-2 mb-4">Billing Address</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="billing_street">Street</Label>
                            <Input id="billing_street" name="street" value={formData.billingAddress?.street || ''} onChange={(e) => handleAddressChange(e, 'billingAddress')} />
                        </div>
                        <div>
                            <Label htmlFor="billing_city">City</Label>
                            <Input id="billing_city" name="city" value={formData.billingAddress?.city || ''} onChange={(e) => handleAddressChange(e, 'billingAddress')} />
                        </div>
                     </div>
                  </div>
                   <div className="md:col-span-2">
                     <h3 className="text-lg font-medium border-b pb-2 mb-4">Shipping Address</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="shipping_street">Street</Label>
                            <Input id="shipping_street" name="street" value={formData.shippingAddress?.street || ''} onChange={(e) => handleAddressChange(e, 'shippingAddress')} />
                        </div>
                        <div>
                            <Label htmlFor="shipping_city">City</Label>
                            <Input id="shipping_city" name="city" value={formData.shippingAddress?.city || ''} onChange={(e) => handleAddressChange(e, 'shippingAddress')} />
                        </div>
                     </div>
                  </div>
                  
                </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4">
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
    </TooltipProvider>
  );
}

    