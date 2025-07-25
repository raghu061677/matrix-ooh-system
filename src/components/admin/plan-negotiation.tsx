
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaPlan } from '@/types/media-plan';
import { sampleAssets, Asset } from './media-manager-types';
import { format } from 'date-fns';
import { ChevronLeft, MoreHorizontal, Search, Settings, FileDown } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface PlanNegotiationProps {
  plan: MediaPlan;
}

const InfoRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string; valueClassName?: string }> = ({ label, value, children, className, valueClassName }) => (
    <div className={("flex justify-between items-center text-sm py-1", className)}>
        <span className="text-muted-foreground">{label}</span>
        {value !== undefined && value !== null ? <span className={("font-medium", valueClassName)}>{value}</span> : children}
    </div>
);

export function PlanNegotiation({ plan: initialPlan }: PlanNegotiationProps) {
    const [plan, setPlan] = React.useState(initialPlan);
    const [assets, setAssets] = React.useState<Asset[]>([]);

    React.useEffect(() => {
        // In a real app, you would fetch the assets associated with the plan.
        // For now, we'll use a subset of sample assets.
        setAssets(sampleAssets.slice(0, 5));
    }, [plan.id]);
    
    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return 'N/A';
        return value.toLocaleString('en-IN');
    };

    return (
        <div className="flex flex-col h-full gap-4">
             <header className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/media-plans/${plan.id}`}><ChevronLeft /></Link>
                    </Button>
                    <h1 className="text-xl font-bold">
                       Plan - Sales Negotiation - {plan.customerName}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Switch id="rotational-switch" />
                    <Label htmlFor="rotational-switch">Rotational</Label>
                    <Button>Save Plan</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                     <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Inventories</CardTitle>
                            <Button variant="outline" size="sm">Printing & Mounting Cost</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup defaultValue="rate-sqft" className="flex items-center gap-4">
                               <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="discounting" id="discounting" />
                                    <Label htmlFor="discounting">Discounting</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pricing" id="pricing" />
                                    <Label htmlFor="pricing">Pricing</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="rate-sqft" id="rate-sqft" />
                                    <Label htmlFor="rate-sqft">Rate / SQFT / Month</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="rate-unit" id="rate-unit" />
                                    <Label htmlFor="rate-unit">Rate / Unit / Month</Label>
                                </div>
                            </RadioGroup>
                            <div className="space-y-2">
                               <Label>Printing</Label>
                               <div className="flex items-center gap-2">
                                 <Input placeholder="FL" /> & <Input placeholder="BL" />
                               </div>
                            </div>
                             <div className="space-y-2">
                               <Label>Mounting</Label>
                               <div className="flex items-center gap-2">
                                 <Input placeholder="FL" /> & <Input placeholder="BL" />
                               </div>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <InfoRow label="HA Markup" valueClassName="text-green-600" value={`${formatCurrency(60000)} (10%)`} />
                             <InfoRow label="TA Markup" valueClassName="text-red-600" value={`${formatCurrency(0)} (0%)`} />
                             <InfoRow label="Expense Difference" value="-" />
                             <InfoRow label="Total SQFT" value={1936.5} />
                             <InfoRow label="Price / SQFT" value={340.82} />
                             <InfoRow label="Total Inventories" value="12 (12 Units)" />
                        </CardContent>
                    </Card>
                </div>
                <Card className="row-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfoRow label="Display Cost" value={formatCurrency(660000)} />
                        <InfoRow label="Printing Cost" value={formatCurrency(0)} />
                        <InfoRow label="Installation Cost" value={formatCurrency(18000)} />
                        <Separator className="my-2"/>
                        <InfoRow label="Total Without Tax" value={formatCurrency(678000)} className="font-semibold"/>
                        <InfoRow label="GST (18%)" value={formatCurrency(122040)} />
                        <Separator className="my-2"/>
                        <InfoRow label="Grand Total" value={formatCurrency(800040)} className="text-lg font-bold" />
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Select defaultValue="general">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter by General, Sr..." className="pl-9" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch id="auto-adjust-dates" />
                        <Label htmlFor="auto-adjust-dates">Auto Adjust Start Dates</Label>
                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                        <Button variant="ghost" size="icon"><Settings /></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Checkbox /></TableHead>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>SQFT</TableHead>
                                    <TableHead>Light</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Photo</TableHead>
                                    <TableHead>Booking Status</TableHead>
                                    <TableHead>Display</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Available From</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Card Rate</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Monthly Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell><Checkbox /></TableCell>
                                        <TableCell>{asset.area}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{asset.location}</TableCell>
                                        <TableCell>{asset.dimensions}</TableCell>
                                        <TableCell>{asset.sqft}</TableCell>
                                        <TableCell>{asset.light}</TableCell>
                                        <TableCell>1</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <FileDown className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell><span className="text-green-600">Available</span></TableCell>
                                        <TableCell>{plan.displayName}</TableCell>
                                        <TableCell>{plan.employee?.name}</TableCell>
                                        <TableCell>Available</TableCell>
                                        <TableCell>{format(new Date(plan.startDate), 'dd/MM/yy')}</TableCell>
                                        <TableCell>{format(new Date(plan.endDate), 'dd/MM/yy')}</TableCell>
                                        <TableCell>{plan.days}</TableCell>
                                        <TableCell>{asset.cardRate}</TableCell>
                                        <TableCell>{asset.baseRate}</TableCell>
                                        <TableCell>55000</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
