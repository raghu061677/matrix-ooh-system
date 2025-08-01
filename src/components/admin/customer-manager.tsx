
'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Search, SlidersHorizontal, ArrowUpDown, Upload, Download, Users, MoreHorizontal, UserPlus, X, MapPin } from 'lucide-react';
import { Customer, Address, ContactPerson } from '@/types/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { fetchGstDetails } from '@/ai/flows/fetch-gst-details';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { ImportWizard } from './import-wizard';
import { Textarea } from '../ui/textarea';

type SortConfig = {
  key: keyof Customer;
  direction: 'ascending' | 'descending';
} | null;

type SearchableField = 'name' | 'gst' | 'email' | 'phone';

const sampleCustomers: Customer[] = [
    { id: 'customer-1', companyId: 'company-1', name: 'ARAVINDA EDUCATIONAL SOCIETY', gst: 'AABTA1310J' },
    { id: 'customer-2', companyId: 'company-1', name: 'CANDEUR DEVELOPERS AND BUILDERS', gst: '36AAOFC5551E1ZF' },
    { id: 'customer-3', companyId: 'company-1', name: 'KESHAV MEMORIAL EDUCATIONAL SOCIETY', gst: '36AACFK6404C1ZT' },
    { id: 'customer-4', companyId: 'company-1', name: 'Active Telugu Film Producers Guild', gst: '36AAIAA1895N1Z7' },
    { id: 'customer-5', companyId: 'company-1', name: 'AKRITTI EXHIBITIONS AND EVENTS', gst: '36AAZFA2377F1Z2' },
];


export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isFetchingGst, startGstTransition] = useTransition();

  const [filter, setFilter] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapAddress, setMapAddress] = useState('');

  const { toast } = useToast();
  const { user } = useAuth();
  
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
    if (user?.companyId) {
        getCustomers();
    }
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
  
  const handleContactPersonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedContacts = [...(formData.contactPersons || [])];
    updatedContacts[index] = { ...updatedContacts[index], [name]: value };
    setFormData(prev => ({ ...prev, contactPersons: updatedContacts }));
  };

  const addContactPerson = () => {
      const newContact: ContactPerson = { name: '', email: '', phone: '' };
      setFormData(prev => ({
          ...prev,
          contactPersons: [...(prev.contactPersons || []), newContact]
      }));
  };
  
  const removeContactPerson = (index: number) => {
      setFormData(prev => ({
          ...prev,
          contactPersons: prev.contactPersons?.filter((_, i) => i !== index)
      }));
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
                const { legalName, tradeName, address, city, state, pincode } = result;
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
      await addDoc(collection(db, 'customers'), dataToSave);
      toast({ title: 'Customer Added!', description: 'The new customer has been added.' });
    }
    await getCustomers();
    setLoading(false);
    closeDialog();
  };

  const openDialog = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    const initialFormData = customer || { 
      paymentTerms: 'Net 30',
      billingAddress: { street: '', city: ''}, 
      shippingAddress: { street: '', city: ''},
      contactPersons: [{ name: '', email: '', phone: '' }]
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
     if (!confirm(`Are you sure you want to delete ${customer.name}? This cannot be undone.`)) return;
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
               customer.pan?.toLowerCase().includes(searchTerm) ||
               customer.email?.toLowerCase().includes(searchTerm) ||
               customer.phone?.toLowerCase().includes(searchTerm);
      });
    }
    return sortableCustomers;
  }, [customers, filter]);

  const handleSelectCustomer = (customerId: string, isSelected: boolean) => {
    if (isSelected) {
        setSelectedCustomers(prev => [...prev, customerId]);
    } else {
        setSelectedCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
        setSelectedCustomers(sortedAndFilteredCustomers.map(c => c.id));
    } else {
        setSelectedCustomers([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0 || !confirm(`Are you sure you want to delete ${selectedCustomers.length} selected customers?`)) return;
    
    setLoading(true);
    const batch = writeBatch(db);
    selectedCustomers.forEach(id => {
        batch.delete(doc(db, 'customers', id));
    });
    
    await batch.commit();
    await getCustomers();
    setSelectedCustomers([]);
    setLoading(false);
    toast({ title: `${selectedCustomers.length} Customers Deleted` });
  };
  
  const handleExport = (format: 'xlsx' | 'pdf' | 'pptx') => {
      const exportData = sortedAndFilteredCustomers.map(c => ({
          Name: c.name,
          GST: c.gst,
          PAN: c.pan,
          Email: c.email,
          Phone: c.phone,
          'Billing Address': `${c.billingAddress?.street || ''}, ${c.billingAddress?.city || ''}`,
          'Shipping Address': `${c.shippingAddress?.street || ''}, ${c.shippingAddress?.city || ''}`
      }));
      
      if (format === 'xlsx') {
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Customers");
          XLSX.writeFile(wb, "customers.xlsx");
      } else if (format === 'pdf') {
          const doc = new jsPDF();
          doc.text("Customer List", 14, 16);
          (doc as any).autoTable({
              head: [['Name', 'GST', 'PAN', 'Email', 'Phone']],
              body: exportData.map(c => [c.Name, c.GST, c.PAN, c.Email, c.Phone]),
              startY: 20
          });
          doc.save('customers.pdf');
      } else if (format === 'pptx') {
          const pptx = new PptxGenJS();
          const slide = pptx.addSlide();
          slide.addText("Customer List", { x:1, y:1, w:'80%', h:1, fontSize:24 });
          const tableData = exportData.map(c => [c.Name, c.GST, c.Email]);
          slide.addTable([['Name', 'GST', 'Email'], ...tableData], { x:1, y:2, w:'80%' });
          pptx.writeFile({ fileName: 'customers.pptx' });
      }
  };
  
  if (loading && !isDialogOpen && !isImportWizardOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Users />Customer Portal</h1>
       </div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
           <Input
            placeholder="Filter customers..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
           {selectedCustomers.length > 0 && (
               <Button variant="destructive" onClick={handleDeleteSelected} disabled={loading}>
                   <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedCustomers.length})
               </Button>
           )}
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsImportWizardOpen(true)} variant="outline"><Upload className="mr-2" /> Import</Button>
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
              <TableHead>
                 <Checkbox
                    checked={selectedCustomers.length > 0 && selectedCustomers.length === sortedAndFilteredCustomers.length}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>PAN</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCustomers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedCustomers.includes(customer.id)}
                    onCheckedChange={(checked) => handleSelectCustomer(customer.id, Boolean(checked))}
                  />
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.gst}</TableCell>
                <TableCell>{customer.pan}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => openDialog(customer)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDelete(customer)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {sortedAndFilteredCustomers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No customers found.
                    </TableCell>
                </TableRow>
            )}
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
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select onValueChange={(value) => handleSelectChange('paymentTerms', value)} value={formData.paymentTerms}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Net 15">Net 15</SelectItem>
                                <SelectItem value="Net 30">Net 30</SelectItem>
                                <SelectItem value="Net 60">Net 60</SelectItem>
                                <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" value={formData.website || ''} onChange={handleFormChange} />
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
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input id="pan" name="pan" value={formData.pan || ''} onChange={handleFormChange} />
                  </div>
                  
                  <div className="md:col-span-2">
                     <h3 className="text-lg font-medium border-b pb-2 my-4">Contact Persons</h3>
                     {formData.contactPersons?.map((contact, index) => (
                         <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 p-4 border rounded-md relative">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => removeContactPerson(index)}><X className="w-4 h-4"/></Button>
                            <div>
                                <Label>Name</Label>
                                <Input name="name" value={contact.name} onChange={(e) => handleContactPersonChange(index, e)} />
                            </div>
                             <div>
                                <Label>Email</Label>
                                <Input name="email" value={contact.email} onChange={(e) => handleContactPersonChange(index, e)} />
                            </div>
                             <div>
                                <Label>Phone</Label>
                                <Input name="phone" value={contact.phone} onChange={(e) => handleContactPersonChange(index, e)} />
                            </div>
                         </div>
                     ))}
                     <Button type="button" variant="outline" size="sm" onClick={addContactPerson}><UserPlus className="mr-2" /> Add Contact</Button>
                  </div>

                  <div className="md:col-span-2">
                     <h3 className="text-lg font-medium border-b pb-2 mb-4">Billing Address</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="billing_street">Street</Label>
                            <div className="flex items-center gap-2">
                                <Input id="billing_street" name="street" value={formData.billingAddress?.street || ''} onChange={(e) => handleAddressChange(e, 'billingAddress')} />
                                <Button type="button" variant="outline" size="icon" onClick={() => {
                                    const address = `${formData.billingAddress?.street || ''}, ${formData.billingAddress?.city || ''}`;
                                    if (address.trim().length > 2) {
                                        setMapAddress(address);
                                        setIsMapDialogOpen(true);
                                    } else {
                                        toast({ variant: 'destructive', title: 'Address required', description: 'Please enter an address to view it on the map.' });
                                    }
                                }}>
                                    <MapPin className="h-4 w-4" />
                                </Button>
                            </div>
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
                             <div className="flex items-center gap-2">
                                <Input id="shipping_street" name="street" value={formData.shippingAddress?.street || ''} onChange={(e) => handleAddressChange(e, 'shippingAddress')} />
                                 <Button type="button" variant="outline" size="icon" onClick={() => {
                                    const address = `${formData.shippingAddress?.street || ''}, ${formData.shippingAddress?.city || ''}`;
                                    if (address.trim().length > 2) {
                                        setMapAddress(address);
                                        setIsMapDialogOpen(true);
                                    } else {
                                        toast({ variant: 'destructive', title: 'Address required', description: 'Please enter an address to view it on the map.' });
                                    }
                                }}>
                                    <MapPin className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="shipping_city">City</Label>
                            <Input id="shipping_city" name="city" value={formData.shippingAddress?.city || ''} onChange={(e) => handleAddressChange(e, 'shippingAddress')} />
                        </div>
                     </div>
                  </div>
                   <div className="md:col-span-2">
                     <Label htmlFor="notes">Notes</Label>
                     <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleFormChange} />
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
      
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Customer Location</DialogTitle>
                <DialogDescription>{mapAddress}</DialogDescription>
            </DialogHeader>
            <div className="aspect-video w-full rounded-md border overflow-hidden">
                <iframe
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&hl=en&z=14&output=embed`}
                ></iframe>
            </div>
        </DialogContent>
      </Dialog>

      <ImportWizard 
        isOpen={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        onImportComplete={getCustomers}
        importType="customers"
      />
    </TooltipProvider>
  );
}

    