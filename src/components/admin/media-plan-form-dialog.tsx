
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarIcon } from 'lucide-react';
import { MediaPlan } from '@/types/media-plan';
import { Customer, User } from '@/types/firestore';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface MediaPlanFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MediaPlan | null;
  customers: Customer[];
  employees: User[];
  onSave: (plan: MediaPlan) => void;
}

export function MediaPlanFormDialog({
  isOpen,
  onOpenChange,
  plan,
  customers,
  employees,
  onSave,
}: MediaPlanFormDialogProps) {
  const [formData, setFormData] = React.useState<Partial<MediaPlan>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (plan) {
      setFormData(plan);
      setDateRange({
        from: new Date(plan.startDate),
        to: new Date(plan.endDate),
      });
    } else {
      setFormData({ projectId: `P-${Date.now().toString().slice(-5)}` });
      setDateRange(undefined);
    }
  }, [plan, isOpen]);

  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setFormData((prev) => ({
        ...prev,
        startDate: dateRange.from,
        endDate: dateRange.to,
        days: differenceInDays(dateRange.to!, dateRange.from!) + 1,
      }));
    } else {
      setFormData((prev) => ({ ...prev, days: undefined }));
    }
  }, [dateRange]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof MediaPlan, value: string) => {
    if (name === 'employeeId') {
      const employee = employees.find((e) => e.id === value);
      if (employee) {
        setFormData((prev) => ({
          ...prev,
          employeeId: value,
          employee: {
            id: employee.id,
            name: employee.name,
            avatar: employee.avatar,
          },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: keyof MediaPlan, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Add any validation logic here
    onSave(formData as MediaPlan);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Add to Plan'}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="new-plan">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-plan">New Plan</TabsTrigger>
            <TabsTrigger value="existing-plan">Existing Plan</TabsTrigger>
          </TabsList>
          <TabsContent value="new-plan">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="displayName">
                      Display Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employee">Employee</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange('employeeId', value)
                        }
                        value={formData.employeeId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
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
                    <div>
                      <Label htmlFor="customer">Customer</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange('customer', value)
                        }
                        value={formData.customer}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((cust) => (
                            <SelectItem key={cust.id} value={cust.name}>
                              {cust.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 items-center gap-2">
                    <Label htmlFor="dates">
                      Dates <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
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
                      <Input
                        id="days"
                        name="days"
                        value={formData.days || ''}
                        placeholder="Days"
                        readOnly
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRotational"
                      checked={formData.isRotational}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('isRotational', checked)
                      }
                    />
                    <Label htmlFor="isRotational">Is Rotational</Label>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : plan ? (
                    'Save Changes'
                  ) : (
                    'Create Plan'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="existing-plan">
            <div className="py-4">
              <p className="text-muted-foreground">
                Select an existing plan to add assets to. This feature is coming
                soon.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
