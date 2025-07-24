
'use client';

import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, FileText, SlidersHorizontal, ArrowUpDown, Upload, Download, CalendarIcon, MoreHorizontal, Sparkles, Search } from 'lucide-react';
import { MediaPlan, MediaPlanStatus } from '@/types/media-plan';
import { Customer, User } from '@/types/firestore';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MediaPlan | null>(null);
  const [formData, setFormData] = useState<Partial<MediaPlan>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  
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
  const mediaPlansCollectionRef = collection(db, 'media_plans');
  const customersCollectionRef = collection(db, 'customers');

  const sampleData: MediaPlan[] = [
      { id: '1', projectId: 'P00109', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'Matrix Network Solutions', displayName: 'CRI', startDate: new Date('2025-07-26'), endDate: new Date('2025-08-24'), days: 30, sqft: 1048.5, amount: 460790, qos: '10.14%', status: 'Draft' },
      { id: '2', projectId: 'P00108', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'Matrix', displayName: 'Matrix ®', startDate: new Date('2025-07-24'), endDate: new Date('2025-08-22'), days: 30, sqft: 1936.5, amount: 800040, qos: '10%', status: 'Draft' },
      { id: '3', projectId: 'P00107', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'Founding Years Learning Solutions Pvt Ltd', displayName: 'Education', startDate: new Date('2025-07-25'), endDate: new Date('2025-10-22'), days: 90, sqft: 161, amount: 194700, qos: '10%', status: 'Confirmed' },
      { id: '4', projectId: 'P00106', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'Matrix Network Solutions', displayName: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), days: 10, sqft: 1280, amount: 224200, qos: '42.5%', status: 'Active' },
      { id: '5', projectId: 'P00094', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'ADMINDS', displayName: 'Sunil Reddy', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-31'), days: 31, sqft: 793, amount: 310929, qos: '6.25%', status: 'Draft' },
      { id: '6', projectId: 'P00105', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customer: 'LAQSHYA MEDIA LIMITED', displayName: 'Quick delivery food campaign', startDate: new Date('2025-07-10'), endDate: new Date('2025-08-08'), days: 30, sqft: 2119.5, amount: 790600, qos: '5.51%', status: 'Draft' },
  ];

  React.useEffect(() => {
    const getData = async () => {
        setLoading(true);
        try {
            // const plansData = await getDocs(mediaPlansCollectionRef);
            // setMediaPlans(plansData.docs.map((doc) => ({ ...doc.data(), id: doc.id } as MediaPlan)));
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

  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
        setFormData(prev => ({
            ...prev,
            startDate: dateRange.from,
            endDate: dateRange.to,
            days: differenceInDays(dateRange.to!, dateRange.from!) + 1
        }));
    } else {
        setFormData(prev => ({ ...prev, days: undefined }));
    }
  }, [dateRange]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof MediaPlan, value: string) => {
    if (name === 'employeeId') {
        const employee = mockEmployees.find(e => e.id === value);
        if (employee) {
            setFormData(prev => ({
                ...prev,
                employeeId: value,
                employee: { id: employee.id, name: employee.name, avatar: employee.avatar }
            }));
        }
    } else {
        setFormData(prev => ({...prev, [name]: value}));
    }
  };

  const handleSwitchChange = (name: keyof MediaPlan, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (currentPlan) {
      setMediaPlans(mediaPlans.map(plan => plan.id === currentPlan.id ? { ...plan, ...formData, id: currentPlan.id } as MediaPlan : plan));
      toast({ title: 'Plan Updated!', description: 'The media plan has been successfully updated.' });
    } else {
      const newPlan = { 
        ...formData, 
        id: `plan-${Math.random()}`, 
        projectId: `P-${Date.now().toString().slice(-5)}`,
        isRotational: formData.isRotational || false,
      } as MediaPlan;
      setMediaPlans([...mediaPlans, newPlan]);
      toast({ title: 'Plan Added!', description: 'The new media plan has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (plan: MediaPlan | null = null) => {
    setCurrentPlan(plan);
    if (plan) {
        setFormData(plan);
        setDateRange({ from: new Date(plan.startDate), to: new Date(plan.endDate) });
    } else {
        setFormData({ projectId: `P-${Date.now().toString().slice(-5)}`});
        setDateRange(undefined);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentPlan(null);
    setFormData({});
    setDateRange(undefined);
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
            else value = plan[col.key as keyof MediaPlan];

           if (value) {
            slide.addText(`${col.label}: ${String(value)}`, { x: 0.5, y, fontSize: 12 });
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
          <Button onClick={() => openDialog()}>
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
                {columnVisibility.customer && <TableCell>{plan.customer}</TableCell>}
                {columnVisibility.display && <TableCell className="text-blue-600">{plan.displayName}</TableCell>}
                {columnVisibility.from && <TableCell>{format(new Date(plan.startDate), 'ddMMMyy')}</TableCell>}
                {columnVisibility.to && <TableCell>{format(new Date(plan.endDate), 'ddMMMyy')}</TableCell>}
                {columnVisibility.days && <TableCell>{plan.days}</TableCell>}
                {columnVisibility.sqft && <TableCell>{plan.sqft}</TableCell>}
                {columnVisibility.amount && <TableCell>{plan.amount?.toLocaleString('en-IN')}</TableCell>}
                {columnVisibility.qos && <TableCell className="text-green-600">{plan.qos}</TableCell>}
                {columnVisibility.status && <TableCell>{plan.status}</TableCell>}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openDialog(plan)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
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

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{currentPlan ? 'Edit Plan' : 'Add to Plan'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="new-plan">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new-plan">New Plan</TabsTrigger>
                    <TabsTrigger value="existing-plan">Existing Plan</TabsTrigger>
                </TabsList>
                <TabsContent value="new-plan">
                    <form onSubmit={handleSave}>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="displayName">Display Name <span className="text-red-500">*</span></Label>
                                    <Input id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="employee">Employee</Label>
                                        <Select onValueChange={(value) => handleSelectChange('employeeId', value)} value={formData.employeeId}>
                                            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                            <SelectContent>
                                                {mockEmployees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="customer">Customer</Label>
                                        <Select onValueChange={(value) => handleSelectChange('customer', value)} value={formData.customer}>
                                            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                                            <SelectContent>
                                                 {customers.map(cust => (
                                                    <SelectItem key={cust.id} value={cust.name}>{cust.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 items-center gap-2">
                                    <Label htmlFor="dates">Dates <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                            id="date"
                                            variant={"outline"}
                                            className="w-full justify-start text-left font-normal"
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                                ) : (
                                                format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                        </Popover>
                                        <Input id="days" name="days" value={formData.days || ''} placeholder="Days" readOnly className="w-20" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="isRotational" checked={formData.isRotational} onCheckedChange={(checked) => handleSwitchChange('isRotational', checked)} />
                                    <Label htmlFor="isRotational">Is Rotational</Label>
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleFormChange} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : (currentPlan ? 'Save Changes' : 'Create Plan')}
                            </Button>
                        </DialogFooter>
                    </form>
                </TabsContent>
                 <TabsContent value="existing-plan">
                    <div className="py-4">
                        <p className="text-muted-foreground">Select an existing plan to add assets to. This feature is coming soon.</p>
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    </DialogFooter>
                </TabsContent>
            </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
