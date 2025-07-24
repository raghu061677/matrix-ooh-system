
'use client';

import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, FileText, SlidersHorizontal, ArrowUpDown, Sparkles, Search, MoreHorizontal } from 'lucide-react';
import { MediaPlan } from '@/types/media-plan';
import { Customer, User } from '@/types/firestore';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { MediaPlanFormDialog } from './media-plan-form-dialog';
import { SelectAssetsDialog } from './select-assets-dialog';
import { Asset } from './media-manager-types';

type SortConfig = {
  key: keyof MediaPlan;
  direction: 'ascending' | 'descending';
} | null;

// Mock data until real data fetching is implemented
const mockEmployees: User[] = [
    { id: 'user-001', uid: 'user-001', name: 'Raghu Gajula', email: 'raghu@example.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: 'user-002', uid: 'user-002', name: 'Sunil Reddy', email: 'sunil@example.com', role: 'sales', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
];

export function MediaPlansManager() {
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MediaPlan | null>(null);
  
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    projectId: true,
    employee: true,
    customer: true,
    display: true,
    from: true,
    to: true,
    days: true,
    sqft: true,
    amount: true,
    qos: true,
    status: true,
  });

  const { toast } = useToast();
  const customersCollectionRef = collection(db, 'customers');

  const sampleData: MediaPlan[] = [
      { id: '1', projectId: 'P00109', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-5', customerName: 'CRI', displayName: 'CRI', startDate: new Date('2025-07-26'), endDate: new Date('2025-08-24'), days: 30, 
        statistics: { haMarkupPercentage: 10.14, taMarkupPercentage: 0, roiPercentage: 0, occupancyPercentage: 0, haMarkup: 35000, taMarkup: 0, qos: '10.14%' },
        inventorySummary: { homeCount: 7, rentedCount: 0, totalSites: 7, pricePerSqft: 362.42, pricePerSqftPerMonth: 362.42, totalSqft: 1048.5 },
        clientGrade: { unbilledSales: 0, effectiveSales: 0, paymentReceived: 0, outstandingSales: 0 },
        costSummary: { displayCost: 380000, printingCost: 0, installationCost: 10500, totalBeforeTax: 390500, gst: 70290, grandTotal: 460790 },
        documents: { emailConfirmations: 0, purchaseOrders: 0, others: 0 },
        status: 'Draft'
      },
      { id: '2', projectId: 'P00108', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-1', customerName: 'MediaVenue', displayName: 'MediaVenue ®', startDate: new Date('2025-07-24'), endDate: new Date('2025-08-22'), days: 30, status: 'Draft' },
      { id: '3', projectId: 'P00107', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-2', customerName: 'Founding Years Learning Solutions Pvt Ltd', displayName: 'Education', startDate: new Date('2025-07-25'), endDate: new Date('2025-10-22'), days: 90, status: 'Confirmed' },
      { id: '4', projectId: 'P00106', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-1', customerName: 'MediaVenue', displayName: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), days: 10, status: 'Active' },
      { id: '5', projectId: 'P00094', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-3', customerName: 'ADMINDS', displayName: 'Sunil Reddy', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-31'), days: 31, status: 'Draft' },
      { id: '6', projectId: 'P00105', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-4', customerName: 'LAQSHYA MEDIA LIMITED', displayName: 'Quick delivery food campaign', startDate: new Date('2025-07-10'), endDate: new Date('2025-08-08'), days: 30, status: 'Draft' },
  ];

  React.useEffect(() => {
    const getData = async () => {
        setLoading(true);
        try {
            // In a real app, you would fetch plans from firestore.
            setMediaPlans(sampleData);
            
            const customersData = await getDocs(customersCollectionRef);
            setCustomers(customersData.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Customer)));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Failed to fetch data' });
        } finally {
            setLoading(false);
        }
    };
    getData();
  }, [toast]);

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
     toast({ title: 'Plan Deleted', description: `${plan.displayName} has been removed.` });
  };

  const requestSort = (key: keyof MediaPlan) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredPlans = useMemo(() => {
    let sortablePlans = [...mediaPlans];
    if (filter) {
      sortablePlans = sortablePlans.filter(plan =>
        Object.values(plan).some(val => {
            if(typeof val === 'object' && val !== null) {
                return Object.values(val).some(nestedVal => String(nestedVal).toLowerCase().includes(filter.toLowerCase()));
            }
            return String(val).toLowerCase().includes(filter.toLowerCase());
        })
      );
    }
    if (sortConfig !== null) {
      sortablePlans.sort((a, b) => {
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
    return sortablePlans;
  }, [mediaPlans, filter, sortConfig]);

  const getSortIcon = (key: keyof MediaPlan) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />; 
  };
  
  const columns: { key: keyof typeof columnVisibility, label: string, sortable?: boolean }[] = [
    { key: 'projectId', label: 'Project ID', sortable: true },
    { key: 'employee', label: 'Employee', sortable: true },
    { key: 'customer', label: 'Customer Name', sortable: true },
    { key: 'display', label: 'Display', sortable: true },
    { key: 'from', label: 'From', sortable: true },
    { key: 'to', label: 'To', sortable: true },
    { key: 'days', label: 'Days' },
    { key: 'sqft', label: 'SQFT' },
    { key: 'amount', label: 'Amount' },
    { key: 'qos', label: 'QoS' },
    { key: 'status', label: 'Status', sortable: true },
  ];
  
  const exportTemplateToExcel = () => {
    const headers = columns.map(c => c.key);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Plans Template');
    XLSX.writeFile(workbook, 'media-plans-template.xlsx');
  };
  
  const exportToExcel = () => {
    const dataToExport = sortedAndFilteredPlans.map(p => ({
      ...p,
      startDate: format(new Date(p.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(p.endDate), 'yyyy-MM-dd'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Plans');
    XLSX.writeFile(workbook, 'media-plans.xlsx');
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text('Media Plans', 20, 10);
    const head = columns
      .filter(c => columnVisibility[c.key])
      .map(c => c.label);
    const body = sortedAndFilteredPlans.map(plan => 
      columns
        .filter(c => columnVisibility[c.key])
        .map(col => {
            if (col.key === 'from') return format(new Date(plan.startDate), 'ddMMMyy');
            if (col.key === 'to') return format(new Date(plan.endDate), 'ddMMMyy');
            if (col.key === 'employee') return plan.employee?.name;
            if (col.key === 'display') return plan.displayName;
            if (col.key === 'customer') return plan.customerName;
            if (col.key === 'sqft') return plan.inventorySummary?.totalSqft;
            if (col.key === 'amount') return plan.costSummary?.grandTotal?.toLocaleString('en-IN');
            if (col.key === 'qos') return plan.statistics?.qos;
            const value = plan[col.key as keyof MediaPlan];
            return value !== null && value !== undefined ? String(value) : '';
        })
    );
    (doc as any).autoTable({ head: [head], body });
    doc.save('media-plans.pdf');
  };

   const exportToPpt = () => {
    const pptx = new PptxGenJS();
    sortedAndFilteredPlans.forEach(plan => {
      const slide = pptx.addSlide();
      slide.addText(`Plan: ${plan.displayName || 'N/A'}`, { x: 0.5, y: 0.5, fontSize: 18, bold: true });
      let y = 1.0;
      columns.forEach(col => {
        if (columnVisibility[col.key]) {
            let value;
            if (col.key === 'from') value = format(new Date(plan.startDate), 'ddMMMyy');
            else if (col.key === 'to') value = format(new Date(plan.endDate), 'ddMMMyy');
            else if (col.key === 'employee') value = plan.employee?.name;
            else if (col.key === 'display') value = plan.displayName;
            else if (col.key === 'customer') value = plan.customerName;
            else if (col.key === 'sqft') value = plan.inventorySummary?.totalSqft;
            else if (col.key === 'amount') value = plan.costSummary?.grandTotal?.toLocaleString('en-IN');
            else if (col.key === 'qos') value = plan.statistics?.qos;
            else value = plan[col.key as keyof MediaPlan];

           if (value) {
            slide.addText(`${String(value)}`, { x: 0.5, y, fontSize: 12 });
            y += 0.4;
           }
        }
      });
    });
    pptx.writeFile({ fileName: 'media-plans.pptx' });
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
        const newPlans: MediaPlan[] = json.map(item => ({
            ...item,
            id: `imported-${Math.random()}`,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            isRotational: item.isRotational === 'true' || item.isRotational === true,
        }));
        
        setMediaPlans(prev => [...prev, ...newPlans]);
        setLoading(false);
        toast({ title: 'Import Successful', description: `${json.length} plans have been imported.` });
    };
    reader.readAsBinaryString(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
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
            placeholder="Filter by Project Id, Employee..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => {}}><Search className="h-4 w-4" /></Button>

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
                  checked={columnVisibility[column.key as keyof typeof columnVisibility]}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({ ...prev, [column.key]: !!value }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => {}}><Sparkles className="mr-2 h-4 w-4" /> Create With AI</Button>
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
              <TableHead padding="checkbox">
                <Checkbox />
              </TableHead>
              {columns.map(col => columnVisibility[col.key as keyof typeof columnVisibility] && (
                 <TableHead key={col.key}>
                   {col.sortable ? (
                     <Button variant="ghost" onClick={() => requestSort(col.key as keyof MediaPlan)}>
                       {col.label}
                       {getSortIcon(col.key as keyof MediaPlan)}
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
            {sortedAndFilteredPlans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>
                {columnVisibility.projectId && <TableCell className="font-medium">{plan.projectId}</TableCell>}
                {columnVisibility.employee && <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={plan.employee?.avatar} />
                            <AvatarFallback>{plan.employee?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{plan.employee?.name}</span>
                    </div>
                </TableCell>}
                {columnVisibility.customer && <TableCell>{plan.customerName}</TableCell>}
                {columnVisibility.display && <TableCell>
                    <Link href={`/admin/media-plans/${plan.id}`} className="text-blue-600 hover:underline">
                        {plan.displayName}
                    </Link>
                </TableCell>}
                {columnVisibility.from && <TableCell>{format(new Date(plan.startDate), 'dd MMM yy')}</TableCell>}
                {columnVisibility.to && <TableCell>{format(new Date(plan.endDate), 'dd MMM yy')}</TableCell>}
                {columnVisibility.days && <TableCell>{plan.days}</TableCell>}
                {columnVisibility.sqft && <TableCell>{plan.inventorySummary?.totalSqft}</TableCell>}
                {columnVisibility.amount && <TableCell>{plan.costSummary?.grandTotal?.toLocaleString('en-IN')}</TableCell>}
                {columnVisibility.qos && <TableCell className="text-green-600">{plan.statistics?.qos}</TableCell>}
                {columnVisibility.status && <TableCell>{plan.status}</TableCell>}
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
        employees={mockEmployees}
        onSave={handleSave}
      />
    </TooltipProvider>
  );
}
