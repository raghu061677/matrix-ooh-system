
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileUp, Check, X, ArrowRight, Table as TableIcon } from 'lucide-react';
import { Stepper, Step, useStepper } from '@/components/ui/stepper';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Asset } from './media-manager-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

interface ImportWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ParsedData = {
  headers: string[];
  rows: any[][];
};

const requiredAssetFields: (keyof Asset)[] = ['name', 'location', 'status'];
const allAssetFields: (keyof Asset)[] = [
    'iid', 'name', 'state', 'district', 'area', 'location', 'direction',
    'latitude', 'longitude', 'media', 'lightType', 'status', 'ownership',
    'dimensions', 'multiface', 'cardRate', 'baseRate', 'rate',
    'totalSqft', 'totalSqft2'
];

export function ImportWizard({
  isOpen,
  onOpenChange,
  onImportComplete,
}: ImportWizardProps) {
    const { stepper, ...stepperProps } = useStepper({
        initialStep: 0,
        steps: [
            { label: 'Upload File' },
            { label: 'Map Fields' },
            { label: 'Preview & Import' },
        ],
    });
    const [parsedData, setParsedData] = React.useState<ParsedData | null>(null);
    const [fieldMapping, setFieldMapping] = React.useState<Record<string, string>>({});
    const [importResult, setImportResult] = React.useState<{success: number, failed: number, errors: string[]}>({success: 0, failed: 0, errors: []});
    const [isProcessing, setIsProcessing] = React.useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

    const resetWizard = () => {
        stepper.resetSteps();
        setParsedData(null);
        setFieldMapping({});
        setImportResult({success: 0, failed: 0, errors: []});
        setIsProcessing(false);
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            resetWizard();
        }
        onOpenChange(open);
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const headers = jsonData[0] || [];
                const rows = jsonData.slice(1);
                
                setParsedData({ headers, rows });

                // Auto-map fields
                const newMapping: Record<string, string> = {};
                allAssetFields.forEach(assetField => {
                    const foundHeader = headers.find(h => h.toLowerCase().replace(/[\s\.]/g, '') === assetField.toLowerCase());
                    if(foundHeader) {
                        newMapping[assetField] = foundHeader;
                    }
                });
                setFieldMapping(newMapping);
                
                stepper.goToNextStep();
            } catch (error) {
                toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not parse the Excel file.' });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingChange = (assetField: string, excelHeader: string) => {
        setFieldMapping(prev => ({ ...prev, [assetField]: excelHeader }));
    }

    const handleImport = async () => {
        if (!parsedData || !user?.companyId) return;

        setIsProcessing(true);
        setImportResult({success: 0, failed: 0, errors: []});

        const batch = writeBatch(db);
        const mediaAssetsCollection = collection(db, 'mediaAssets');
        let successCount = 0;
        const localErrors: string[] = [];

        parsedData.rows.forEach((row, index) => {
            const assetData: Partial<Asset> = {};
            
            allAssetFields.forEach(field => {
                const mappedHeader = fieldMapping[field];
                if (mappedHeader) {
                    const headerIndex = parsedData.headers.indexOf(mappedHeader);
                    if (headerIndex > -1) {
                         const value = row[headerIndex];
                         if (value !== undefined && value !== null && value !== '') {
                            (assetData as any)[field] = value;
                         }
                    }
                }
            });

            // Basic validation
            const missingFields = requiredAssetFields.filter(field => !assetData[field]);
            if (missingFields.length > 0) {
                localErrors.push(`Row ${index + 2}: Missing required fields - ${missingFields.join(', ')}`);
                return;
            }

            // Data transformation and type casting
            const finalAssetData: Partial<Asset> = {
                ...assetData,
                companyId: user.companyId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                cardRate: Number(assetData.cardRate) || 0,
                baseRate: Number(assetData.baseRate) || 0,
                rate: Number(assetData.rate) || 0,
                latitude: Number(assetData.latitude) || undefined,
                longitude: Number(assetData.longitude) || undefined,
                totalSqft: Number(assetData.totalSqft) || 0,
                totalSqft2: Number(assetData.totalSqft2) || 0,
                multiface: String(assetData.multiface).toLowerCase() === 'true',
            };

            const docRef = doc(mediaAssetsCollection);
            batch.set(docRef, finalAssetData);
            successCount++;
        });
        
        try {
            await batch.commit();
            setImportResult({ success: successCount, failed: localErrors.length, errors: localErrors });
            toast({ title: 'Import Complete!', description: `${successCount} records imported.` });
            onImportComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: `Could not commit changes to the database. ${error.message}` });
        } finally {
            setIsProcessing(false);
            stepper.goToNextStep();
        }
    };


    const renderStepContent = () => {
        switch(stepper.activeStep) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg p-12">
                        <FileUp className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Upload your Excel File</h3>
                        <p className="text-muted-foreground mb-4">Drag and drop your file here or click to browse.</p>
                        <Button asChild>
                            <label htmlFor="import-file">
                                Browse Files
                                <input id="import-file" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                            </label>
                        </Button>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <DialogDescription className="mb-4">
                           Match the columns from your file to the corresponding fields in the application. Required fields are marked with an asterisk.
                        </DialogDescription>
                        <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Application Field</TableHead>
                                        <TableHead>Your Excel Column</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allAssetFields.map(field => (
                                        <TableRow key={field}>
                                            <TableCell className="font-medium capitalize">
                                                {field.replace(/([A-Z])/g, ' $1')}
                                                {requiredAssetFields.includes(field as any) && <span className="text-destructive">*</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Select onValueChange={(value) => handleMappingChange(field, value)} value={fieldMapping[field]}>
                                                    <SelectTrigger><SelectValue placeholder="Select a column..."/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="--skip--">-- Skip this field --</SelectItem>
                                                        {parsedData?.headers.map(header => (
                                                            <SelectItem key={header} value={header}>{header}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                );
            case 2:
                return (
                     <div>
                        <DialogDescription className="mb-4">
                           Review a preview of your data before starting the import.
                        </DialogDescription>
                         <ScrollArea className="h-[400px] border rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        {allAssetFields.filter(f => fieldMapping[f] && fieldMapping[f] !== '--skip--').map(field => (
                                            <TableHead key={field} className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData?.rows.slice(0, 10).map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {allAssetFields.filter(f => fieldMapping[f] && fieldMapping[f] !== '--skip--').map(field => {
                                                const header = fieldMapping[field];
                                                const headerIndex = parsedData.headers.indexOf(header);
                                                return <TableCell key={field}>{row[headerIndex]}</TableCell>
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                         </ScrollArea>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold mb-2">Import Results</h3>
                        <div className="flex justify-center gap-8">
                            <div className="flex items-center gap-2 text-green-600">
                                <Check className="w-8 h-8" />
                                <div>
                                    <div className="text-2xl font-bold">{importResult.success}</div>
                                    <div>Successful</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-destructive">
                                <X className="w-8 h-8" />
                                <div>
                                    <div className="text-2xl font-bold">{importResult.failed}</div>
                                    <div>Failed</div>
                                </div>
                            </div>
                        </div>
                        {importResult.errors.length > 0 && (
                            <ScrollArea className="h-[200px] mt-4 border rounded-md p-2 text-left text-sm">
                               <h4 className="font-semibold mb-2">Error Details:</h4>
                               <ul>
                                {importResult.errors.map((err, i) => <li key={i} className="mb-1">{err}</li>)}
                               </ul>
                            </ScrollArea>
                        )}
                    </div>
                )
        }
    }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Media Assets</DialogTitle>
           <Stepper {...stepperProps} className="mt-4" />
        </DialogHeader>
        <div className="flex-grow overflow-hidden py-4 relative">
            {isProcessing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader2 className="w-12 h-12 animate-spin" />
                </div>
            )}
            {renderStepContent()}
        </div>
        <DialogFooter>
            {stepper.activeStep === 0 && <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>}
            {stepper.activeStep > 0 && stepper.activeStep < 3 && <Button variant="outline" onClick={stepper.goToPreviousStep} disabled={isProcessing}>Back</Button>}
            {stepper.activeStep === 1 && <Button onClick={stepper.goToNextStep} disabled={Object.keys(fieldMapping).length === 0}>Preview Data <ArrowRight className="ml-2 w-4 h-4"/></Button>}
            {stepper.activeStep === 2 && <Button onClick={handleImport} disabled={isProcessing}>Start Import <TableIcon className="ml-2 w-4 h-4" /></Button>}
            {stepper.activeStep === 3 && <DialogClose asChild><Button>Done</Button></DialogClose>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
