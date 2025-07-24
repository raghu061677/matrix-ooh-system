
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { PlusCircle, Edit, Trash2, Loader2, FileText, SlidersHorizontal, ArrowUpDown, Upload, Download } from 'lucide-react';
import { MediaPlan, MediaPlanStatus } from '@/types/media-plan';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';

type SortConfig = {
  key: keyof MediaPlan;
  direction: 'ascending' | 'descending';
} | null;

export function MediaPlansManager() {
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MediaPlan | null>(null);
  const [formData, setFormData] = useState<Partial<MediaPlan>>({});
  
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    planId: true,
    displayName: true,
    customer: true,
    status: true,
    startDate: true,
    endDate: true,
  });

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
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-31'),
    },
    {
        id: 'plan-002',
        planId: 'P-2024-002',
        displayName: 'New Product Launch',
        customer: 'Apple',
        status: 'Confirmed',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31'),
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof MediaPlan, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (currentPlan) {
      // Update logic (currently mocked)
      setMediaPlans(mediaPlans.map(plan => plan.id === currentPlan.id ? { ...plan, ...formData, id: currentPlan.id } as MediaPlan : plan));
      toast({ title: 'Plan Updated!', description: 'The media plan has been successfully updated.' });
    } else {
      // Add logic (currently mocked)
      const newPlan = { ...formData, id: `plan-${Math.random()}`, startDate: new Date(), endDate: new Date() } as MediaPlan;
      setMediaPlans([...mediaPlans, newPlan]);
      toast({ title: 'Plan Added!', description: 'The new media plan has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (plan: MediaPlan | null = null) => {
    setCurrentPlan(plan);
    setFormData(plan || { planId: `P-${Date.now()}`});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentPlan(null);
    setFormData({});
  };
  
  const handleDelete = async (plan: MediaPlan) => {
     // const planDoc = doc(db, 'media_plans', plan.id);
     // await deleteDoc(planDoc);
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
        Object.values(plan).some(val => 
          String(val).toLowerCase().includes(filter.toLowerCase())
        )
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
    { key: 'planId', label: 'Plan ID', sortable: true },
    { key: 'displayName', label: 'Display Name', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
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
            if (col.key === 'startDate' || col.key === 'endDate') {
                return format(new Date(plan[col.key]), 'PPP');
            }
            return plan[col.key as keyof MediaPlan] ?? '';
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
            if (col.key === 'startDate' || col.key === 'endDate') {
                value = format(new Date(plan[col.key]), 'PPP');
            } else {
                value = plan[col.key as keyof MediaPlan];
            }

           if (value) {
            slide.addText(`${col.label}: ${value}`, { x: 0.5, y, fontSize: 12 });
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

        // This is a mock implementation. In a real app, you would add to Firestore.
        setLoading(true);
        const newPlans: MediaPlan[] = json.map(item => ({
            ...item,
            id: `imported-${Math.random()}`,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
        }));
        
        setMediaPlans(prev => [...prev, ...newPlans]);
        setLoading(false);
        toast({ title: 'Import Successful', description: `${json.length} plans have been imported.` });
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
           <Input
            placeholder="Filter plans..."
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
                <TooltipContent>Export Plans</TooltipContent>
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
            Add New Plan
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
                {columnVisibility.planId && <TableCell className="font-medium">{plan.planId}</TableCell>}
                {columnVisibility.displayName && <TableCell>{plan.displayName}</TableCell>}
                {columnVisibility.customer && <TableCell>{plan.customer}</TableCell>}
                {columnVisibility.status && <TableCell>{plan.status}</TableCell>}
                {columnVisibility.startDate && <TableCell>{format(new Date(plan.startDate), 'PPP')}</TableCell>}
                {columnVisibility.endDate && <TableCell>{format(new Date(plan.endDate), 'PPP')}</TableCell>}
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
                <Input id="planId" name="planId" value={formData.planId || ''} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} required />
              </div>
               <div>
                <Label htmlFor="customer">Customer</Label>
                <Input id="customer" name="customer" value={formData.customer || ''} onChange={handleFormChange} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                 <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
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
    </TooltipProvider>
  );
}
