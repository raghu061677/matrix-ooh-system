
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon } from 'lucide-react';
import { MediaPlan, PlanStatus } from '@/types/media-plan';
import { Customer, User } from '@/types/firestore';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ScrollArea } from '../ui/scroll-area';

interface MediaPlanFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Partial<MediaPlan> | null;
  customers: Customer[];
  employees: User[];
  onSave: (plan: Partial<MediaPlan>) => void;
  loading: boolean;
}

export function MediaPlanFormDialog({
  isOpen,
  onOpenChange,
  plan,
  customers,
  employees,
  onSave,
  loading,
}: MediaPlanFormDialogProps) {
  const [formData, setFormData] = React.useState<Partial<MediaPlan>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (plan) {
      setFormData(plan);
      if(plan.startDate && plan.endDate) {
        setDateRange({
          from: new Date(plan.startDate as any),
          to: new Date(plan.endDate as any),
        });
      }
    } else {
      setFormData({ status: 'Draft' });
      setDateRange(undefined);
    }
  }, [plan, isOpen]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof MediaPlan, value: string) => {
    if (name === 'customerId') {
      const customer = customers.find(c => c.id === value);
      setFormData((prev) => ({ ...prev, customerId: value, customerName: customer?.name }));
    } else if (name === 'employeeId') {
      const employee = employees.find(e => e.id === value);
       setFormData((prev) => ({ ...prev, employeeId: value, employee: {id: employee!.id, name: employee!.name, avatar: employee!.avatar }}));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const days = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0;
    const dataToSave: Partial<MediaPlan> = {
        ...formData,
        startDate: dateRange?.from,
        endDate: dateRange?.to,
        days,
    }
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{plan?.id ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <ScrollArea className="flex-grow pr-6">
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} />
                      </div>
                       <div>
                        <Label htmlFor="employeeId">Assigned Employee</Label>
                          <Select
                            onValueChange={(value) =>
                              handleSelectChange('employeeId', value)
                            }
                            value={formData.employeeId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="customerId">Customer</Label>
                          <Select
                            onValueChange={(value) =>
                              handleSelectChange('customerId', value)
                            }
                            value={formData.customerId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((cust) => (
                                <SelectItem key={cust.id} value={cust.id}>
                                  {cust.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="grid grid-cols-1 items-center gap-2 md:col-span-2">
                        <Label htmlFor="dates">
                          Dates
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={'outline'}
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                                    {format(dateRange.to, 'LLL dd, y')}
                                  </>
                                ) : (
                                  format(dateRange.from, 'LLL dd, y')
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
                      </div>

                       <div>
                        <Label htmlFor="status">Status</Label>
                          <Select
                            onValueChange={(value) =>
                              handleSelectChange('status', value as PlanStatus)
                            }
                            value={formData.status}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Converted">Converted</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                    </div>
                  </div>
              </ScrollArea>
              <DialogFooter className="flex-shrink-0 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : plan?.id ? (
                    'Save Changes'
                  ) : (
                    'Create Plan'
                  )}
                </Button>
              </DialogFooter>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
