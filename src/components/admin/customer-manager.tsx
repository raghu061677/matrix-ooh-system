
'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, endBefore, limitToLast, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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
import { Customer } from '@/types/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { getGstDetails } from '@/lib/actions';
import { ScrollArea } from '../ui/scroll-area';

type SortConfig = {
  key: keyof Customer;
  direction: 'ascending' | 'descending';
} | null;

type SearchableField = 'name' | 'gst' | 'pocName' | 'pocPhone';

const PAGE_SIZE = 10;

const sampleCustomers: Customer[] = [
    { id: 'customer-1', code: 'CUST-001', name: 'MediaVenue', gst: '29AAACN1234F1Z5', contactPersons: [{ name: 'Anil Kumar', phone: '9876543210', designation: 'Manager' }], addresses: [{ type: 'billing', street: '123 Cyberabad', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' }] },
    { id: 'customer-2', code: 'CUST-002', name: 'Founding Years Learning', gst: '36ABCFY1234G1Z2', contactPersons: [{ name: 'Sunitha Reddy', phone: '9876543211', designation: 'Director' }], addresses: [{ type: 'billing', street: '456 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033' }] },
    { id: 'customer-3', code: 'CUST-003', name: 'ADMINDS', gst: '27AAAAA0000A1Z5', contactPersons: [{ name: 'Sunil Reddy', phone: '9876543212', designation: 'Proprietor' }], addresses: [{ type: 'billing', street: '789 Gachibowli', city: 'Hyderabad', state: 'Telangana', postalCode: '500032' }] },
    { id: 'customer-4', code: 'CUST-004', name: 'LAQSHYA MEDIA LIMITED', gst: '24AACCL5678B1Z9', contactPersons: [{ name: 'Vikram Singh', phone: '9876543213', designation: 'Head of Operations' }], addresses: [{ type: 'billing', street: '101 Madhapur', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' }] },
    { id: 'customer-5', code: 'CUST-005', name: 'CRI', gst: '33AACFC4321H1Z4', contactPersons: [{ name: 'Priya Sharma', phone: '9876543214', designation: 'Marketing Head' }], addresses: [{ type: 'billing', street: '212 Banjara Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500034' }] },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    code: true,
    name: true,
    gst: true,
    primaryContact: true,
    city: false,
    state: true,
    postalCode: false,
  });
  
  // Pagination state
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [page, setPage] = useState(1);

  const { toast } = useToast();
  const customersCollectionRef = collection(db, 'customers');
  
  const fetchCustomers = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
      setLoading(true);
      try {
          let q;
          const mainQuery = query(customersCollectionRef, orderBy('code'), limit(PAGE_SIZE));

          if (direction === 'next' && lastVisible) {
              q = query(customersCollectionRef, orderBy('code'), startAfter(lastVisible), limit(PAGE_SIZE));
              setPage(prev => prev + 1);
          } else if (direction === 'prev' && firstVisible) {
              q = query(customersCollectionRef, orderBy('code'), endBefore(firstVisible), limitToLast(PAGE_SIZE));
              setPage(prev => prev - 1);
          } else {
              q = mainQuery;
              setPage(1);
          }

          const data = await getDocs(q);
          
          if (!data.empty) {
              const dbCustomers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Customer));
              setCustomers(dbCustomers);
              setFirstVisible(data.docs[0]);
              setLastVisible(data.docs[data.docs.length - 1]);
              
              const prevSnap = await getDocs(query(customersCollectionRef, orderBy('code'), endBefore(data.docs[0]), limitToLast(1)));
              setIsFirstPage(prevSnap.empty);

              const nextSnap = await getDocs(query(customersCollectionRef, orderBy('code'), startAfter(data.docs[data.docs.length - 1]), limit(1)));
              setIsLastPage(nextSnap.empty);

          } else if (direction === 'initial') {
              setCustomers(sampleCustomers.slice(0, PAGE_SIZE));
              setIsLastPage(sampleCustomers.length <= PAGE_SIZE);
          }
      } catch (e) {
          console.error("Error fetching customers:", e);
          toast({
              variant: 'destructive',
              title: 'Error fetching customers',
              description: 'Could not retrieve customer data. Using sample data.'
          });
          setCustomers(sampleCustomers.slice(0, PAGE_SIZE));
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchCustomers('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
                description: 'Business Name and address have been populated.',
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
    const initialFormData = customer || { 
      code: `CUST-${Math.floor(Date.now() / 1000)}`,
      contactPersons: [{}], 
      addresses: [{ type: 'billing' }] 
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
     setCustomers(customers.filter(c => c.id !== customer.id));
     toast({ title: 'Customer Deleted', description: `${customer.name} has been removed.` });
  };

  const requestSort = (key: keyof Customer) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredCustomers = useMemo(() => {
    let sortableCustomers = [...customers];
    if (filter) {
      sortableCustomers = sortableCustomers.filter(customer => {
        const searchTerm = filter.toLowerCase();
        switch (searchField) {
          case 'name':
            return customer.name?.toLowerCase().includes(searchTerm);
          case 'gst':
            return customer.gst?.toLowerCase().includes(searchTerm);
          case 'pocName':
            return customer.contactPersons?.some(p => p.name?.toLowerCase().includes(searchTerm));
          case 'pocPhone':
            return customer.contactPersons?.some(p => p.phone?.toLowerCase().includes(searchTerm));
          default:
            return Object.values(customer).some(val =>
              String(val).toLowerCase().includes(searchTerm)
            );
        }
      });
    }
    if (sortConfig !== null) {
      sortableCustomers.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [customers, filter, sortConfig, searchField]);

  const getSortIcon = (key: keyof Customer) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />; 
  };
  
  const columns: { key: keyof typeof columnVisibility, label: string, sortable?: boolean }[] = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'gst', label: 'GST', sortable: true },
    { key: 'primaryContact', label: 'Primary Contact' },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'postalCode', label: 'Postal Code' },
  ];

  const exportTemplateToExcel = () => {
    const headers = [
      'code', 'name', 'gst', 
      'contactPersonName', 'contactPersonPhone', 'contactPersonDesignation', 
      'addressType', 'addressStreet', 'addressCity', 'addressState', 'addressPostalCode'
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers Template');
    XLSX.writeFile(workbook, 'customers-template.xlsx');
  };
  
  const exportToExcel = () => {
    const dataToExport = sortedAndFilteredCustomers.map(c => ({
      ...c,
      primaryContact: c.contactPersons?.[0]?.name,
      city: c.addresses?.[0]?.city,
      state: c.addresses?.[0]?.state,
      postalCode: c.addresses?.[0]?.postalCode,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'customers.xlsx');
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text('Customers', 20, 10);
    const head = columns
      .filter(c => columnVisibility[c.key])
      .map(c => c.label);
    const body = sortedAndFilteredCustomers.map(customer => 
      columns
        .filter(c => columnVisibility[c.key])
        .map(col => {
            if (col.key === 'primaryContact') return customer.contactPersons?.[0]?.name ?? '';
            if (col.key === 'city') return customer.addresses?.[0]?.city ?? '';
            if (col.key === 'state') return customer.addresses?.[0]?.state ?? '';
            if (col.key === 'postalCode') return customer.addresses?.[0]?.postalCode ?? '';
            return customer[col.key as keyof Customer] ?? '';
        })
    );
    (doc as any).autoTable({ head: [head], body });
    doc.save('customers.pdf');
  };

   const exportToPpt = () => {
    const pptx = new PptxGenJS();
    sortedAndFilteredCustomers.forEach(customer => {
      const slide = pptx.addSlide();
      slide.addText(`Customer: ${customer.name || 'N/A'}`, { x: 0.5, y: 0.5, fontSize: 18, bold: true });
      let y = 1.0;
      columns.forEach(col => {
        if (columnVisibility[col.key]) {
            let value;
            if (col.key === 'primaryContact') value = customer.contactPersons?.[0]?.name;
            else if (col.key === 'city') value = customer.addresses?.[0]?.city;
            else if (col.key === 'state') value = customer.addresses?.[0]?.state;
            else if (col.key === 'postalCode') value = customer.addresses?.[0]?.postalCode;
            else value = customer[col.key as keyof Customer];

           if (value) {
            slide.addText(`${col.label}: ${value}`, { x: 0.5, y, fontSize: 12 });
            y += 0.4;
           }
        }
      });
    });
    pptx.writeFile({ fileName: 'customers.pptx' });
  };
  
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        setLoading(true);
        for (const item of json) {
            const customerData: Partial<Customer> = {
                code: item.code,
                name: item.name,
                gst: item.gst,
                contactPersons: [{
                    name: item.contactPersonName,
                    phone: item.contactPersonPhone,
                    designation: item.contactPersonDesignation
                }],
                addresses: [{
                    type: item.addressType,
                    street: item.addressStreet,
                    city: item.addressCity,
                    state: item.addressState,
                    postalCode: item.addressPostalCode
                }]
            };
            await addDoc(customersCollectionRef, customerData);
        }
        
        await fetchCustomers('initial');
        setLoading(false);
        toast({ title: 'Import Successful', description: `${json.length} customers have been imported.` });
    };
    reader.readAsBinaryString(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
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
            <Select onValueChange={(value: SearchableField) => setSearchField(value)} defaultValue={searchField}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Search by..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name">Customer Name</SelectItem>
                    <SelectItem value="gst">GST</SelectItem>
                    <SelectItem value="pocName">POC Name</SelectItem>
                    <SelectItem value="pocPhone">POC Number</SelectItem>
                </SelectContent>
            </Select>
           <Input
            placeholder="Filter customers on this page..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleImport}>
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Import</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import from Excel</TooltipContent>
          </Tooltip>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".xlsx, .xls"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={exportTemplateToExcel}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download Template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download Excel Template</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Export</span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Export Customers</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPdf}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPpt}>PowerPoint</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle columns</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Toggle Columns</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                 <DropdownMenuCheckboxItem
                  key={column.key}
                  className="capitalize"
                  checked={columnVisibility[column.key]}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({ ...prev, [column.key]: !!value }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
              {columns.map(col => columnVisibility[col.key as keyof typeof columnVisibility] && (
                 <TableHead key={col.key}>
                   {col.sortable ? (
                     <Button variant="ghost" onClick={() => requestSort(col.key as keyof Customer)}>
                       {col.label}
                       {getSortIcon(col.key as keyof Customer)}
                     </Button>
                   ) : (
                     col.label
                   )}
                 </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCustomers.map(customer => (
              <TableRow key={customer.id}>
                {columnVisibility.code && <TableCell className="font-medium">{customer.code}</TableCell>}
                {columnVisibility.name && <TableCell>{customer.name}</TableCell>}
                {columnVisibility.gst && <TableCell>{customer.gst}</TableCell>}
                {columnVisibility.primaryContact && <TableCell>{customer.contactPersons?.[0]?.name}</TableCell>}
                {columnVisibility.city && <TableCell>{customer.addresses?.[0]?.city}</TableCell>}
                {columnVisibility.state && <TableCell>{customer.addresses?.[0]?.state}</TableCell>}
                {columnVisibility.postalCode && <TableCell>{customer.addresses?.[0]?.postalCode}</TableCell>}
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
       <div className="flex justify-end items-center gap-2 mt-4">
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
            variant="outline"
            onClick={() => fetchCustomers('prev')}
            disabled={isFirstPage || loading}
        >
            Previous
        </Button>
        <Button
            variant="outline"
            onClick={() => fetchCustomers('next')}
            disabled={isLastPage || loading}
        >
            Next
        </Button>
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
                    <Label htmlFor="code">Customer Code</Label>
                    <Input id="code" name="code" value={formData.code || ''} onChange={handleFormChange} readOnly={!!currentCustomer} />
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

    