
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
import { ChevronLeft, MoreHorizontal, Search, Settings, FileDown, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface PlanNegotiationProps {
  plan: MediaPlan;
}

const InfoRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string; valueClassName?: string }> = ({ label, value, children, className, valueClassName }) => (
    <div className={("flex justify-between items-center text-sm py-1 " + className)}>
        <span className="text-muted-foreground">{label}</span>
        {value !== undefined && value !== null ? <span className={"font-medium " + valueClassName}>{value}</span> : children}
    </div>
);

export function PlanNegotiation({ plan: initialPlan }: PlanNegotiationProps) {
    const [plan, setPlan] = React.useState(initialPlan);
    const [assets, setAssets] = React.useState<any[]>([]);
    const [isMapDialogOpen, setIsMapDialogOpen] = React.useState(false);
    const [mapAsset, setMapAsset] = React.useState<Asset | null>(null);

    React.useEffect(() => {
        const fetchAssets = async () => {
            if (!plan.id) return;
            const planDocRef = doc(db, 'plans', plan.id);
            const planDoc = await getDoc(planDocRef);
            if (planDoc.exists()) {
                const planData = planDoc.data();
                setAssets(planData.mediaAssets || []);
            } else {
                 setAssets(sampleAssets.slice(0, 5));
            }
        };
        fetchAssets();
    }, [plan.id]);
    
    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return 'N/A';
        return `₹${value.toLocaleString('en-IN')}`;
    };
    
    const openMapDialog = (asset: Asset) => {
        setMapAsset(asset);
        setIsMapDialogOpen(true);
    };

    const getAssetTotalSqft = (asset: Asset | null) => {
        if (!asset) return 0;
        const sqft1 = asset.totalSqft || 0;
        const sqft2 = asset.multiface ? (asset.totalSqft2 || 0) : 0;
        return sqft1 + sqft2;
    };

    return (
        <TooltipProvider>
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
                                <InfoRow label="HA Markup" valueClassName="text-green-600" value={`${formatCurrency(plan.statistics?.haMarkup)} (${plan.statistics?.haMarkupPercentage}%)`} />
                                <InfoRow label="TA Markup" valueClassName="text-red-600" value={`${formatCurrency(plan.statistics?.taMarkup)} (${plan.statistics?.taMarkupPercentage}%)`} />
                                <InfoRow label="Expense Difference" value="-" />
                                <InfoRow label="Total SQFT" value={plan.inventorySummary?.totalSqft} />
                                <InfoRow label="Price / SQFT" value={plan.inventorySummary?.pricePerSqft} />
                                <InfoRow label="Total Inventories" value={`${plan.inventorySummary?.totalSites} (${plan.inventorySummary?.totalSites} Units)`} />
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="row-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InfoRow label="Display Cost" value={formatCurrency(plan.costSummary?.displayCost)} />
                            <InfoRow label="Printing Cost" value={formatCurrency(plan.costSummary?.printingCost)} />
                            <InfoRow label="Installation Cost" value={formatCurrency(plan.costSummary?.installationCost)} />
                            <Separator className="my-2"/>
                            <InfoRow label="Total Without Tax" value={formatCurrency(plan.costSummary?.totalBeforeTax)} className="font-semibold"/>
                            <InfoRow label="GST (18%)" value={formatCurrency(plan.costSummary?.gst)} />
                            <Separator className="my-2"/>
                            <InfoRow label="Grand Total" value={formatCurrency(plan.costSummary?.grandTotal)} className="text-lg font-bold" />
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
                                        <TableHead>Rate</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Map</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.map(asset => (
                                        <TableRow key={asset.id}>
                                            <TableCell><Checkbox /></TableCell>
                                            <TableCell>{asset.area}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{asset.location}</TableCell>
                                            <TableCell>{formatCurrency(asset.rate)}</TableCell>
                                            <TableCell>{plan.startDate ? format(new Date(plan.startDate as any), 'dd/MM/yy') : 'N/A'}</TableCell>
                                            <TableCell>{plan.endDate ? format(new Date(plan.endDate as any), 'dd/MM/yy') : 'N/A'}</TableCell>
                                            <TableCell>{plan.days}</TableCell>
                                            <TableCell>
                                                {asset.latitude && asset.longitude && (
                                                    <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => openMapDialog(asset)}>
                                                            <MapPin className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view map</p>
                                                    </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{mapAsset?.location}</DialogTitle>
                    <DialogDescription>Direction: {mapAsset?.direction || 'N/A'}</DialogDescription>
                </DialogHeader>
                <div className="aspect-video w-full rounded-md border overflow-hidden">
                    {mapAsset?.latitude && mapAsset?.longitude && (
                    <iframe
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${mapAsset.latitude},${mapAsset.longitude}&hl=es&z=14&output=embed`}
                    ></iframe>
                    )}
                </div>
                <DialogFooter className="sm:justify-start">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm w-full">
                        <span><strong>Dimension:</strong> {mapAsset?.dimensions || 'N/A'}</span>
                        <span><strong>Total SqFt:</strong> {getAssetTotalSqft(mapAsset as Asset)}</span>
                        <span><strong>Light Type:</strong> {mapAsset?.lightType || 'N/A'}</span>
                        <span><strong>Area:</strong> {mapAsset?.area || 'N/A'}</span>
                    </div>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
