
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
import { Stepper, useStepper } from '@/components/ui/stepper';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { collection, writeBatch, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Asset } from './media-manager-types';
import { Customer } from '@/types/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

interface ImportWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  importType: 'assets' | 'customers';
}

type ParsedData = {
  headers: string[];
  rows: any[][];
};

const importConfig = {
    assets: {
        collectionName: 'mediaAssets',
        requiredFields: ['name', 'location', 'status'] as (keyof Asset)[],
        allFields: [
            'iid', 'name', 'state', 'district', 'area', 'location', 'direction',
            'latitude', 'longitude', 'media', 'lightType', 'status', 'ownership',
            'dimensions', 'multiface', 'cardRate', 'baseRate', 'rate',
            'totalSqft', 'totalSqft2', 'size.width', 'size.height', 'size2.width', 'size2.height'
        ] as string[],
        uniqueIdentifier: 'iid',
    },
    customers: {
        collectionName: 'customers',
        requiredFields: ['name'] as (keyof Customer)[],
        allFields: [
            'name', 'gst', 'pan', 'email', 'phone', 'website', 'paymentTerms',
            'billingAddress.street', 'billingAddress.city', 'billingAddress.state', 'billingAddress.postalCode',
            'shippingAddress.street', 'shippingAddress.city', 'shippingAddress.state', 'shippingAddress.postalCode',
            'notes'
        ] as string[],
        uniqueIdentifier: 'gst',
    }
}


export function ImportWizard({
  isOpen,
  onOpenChange,
  onImportComplete,
  importType,
}: ImportWizardProps) {
    const { activeStep, goToNextStep, goToPreviousStep, resetSteps, setStep } = useStepper({
        initialStep: 0,
        steps: [
            { label: 'Upload File' },
            { label: 'Map Fields' },
            { label: 'Preview & Import' },
            { label: 'Results' }
        ],
    });
    const [parsedData, setParsedData] = React.useState<ParsedData | null>(null);
    const [fieldMapping, setFieldMapping] = React.useState<Record<string, string>>({});
    const [importResult, setImportResult] = React.useState<{success: number, failed: number, errors: string[]}>({success: 0, failed: 0, errors: []});
    const [isProcessing, setIsProcessing] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);


    const { user } = useAuth();
    const { toast } = useToast();
    
    const config = importConfig[importType];

    const resetWizard = React.useCallback(() => {
        resetSteps();
        setParsedData(null);
        setFieldMapping({});
        setImportResult({success: 0, failed: 0, errors: []});
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [resetSteps]);

    const handleClose = React.useCallback((open: boolean) => {
        if (!open) {
            resetWizard();
        }
        onOpenChange(open);
    }, [onOpenChange, resetWizard]);

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
                
                const headers = jsonData[0]?.map(String) || [];
                const rows = jsonData.slice(1);
                
                setParsedData({ headers, rows });

                // Auto-map fields
                const newMapping: Record<string, string> = {};
                config.allFields.forEach(appField => {
                    const foundHeader = headers.find(h => h.toLowerCase().replace(/[\s\.]/g, '') === appField.toLowerCase().replace(/[\s\.]/g, ''));
                    if(foundHeader) {
                        newMapping[appField] = foundHeader;
                    }
                });
                setFieldMapping(newMapping);
                
                goToNextStep();
            } catch (error) {
                toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not parse the Excel file.' });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingChange = (appField: string, excelHeader: string) => {
        setFieldMapping(prev => ({ ...prev, [appField]: excelHeader }));
    }

    const handleImport = async () => {
        if (!parsedData || !user?.companyId) return;

        setIsProcessing(true);
        goToNextStep(); // Move to results step immediately
        setImportResult({success: 0, failed: 0, errors: []});
        
        let successCount = 0;
        const localErrors: string[] = [];

        const collectionRef = collection(db, config.collectionName);

        const uniqueIdentifierHeader = fieldMapping[config.uniqueIdentifier];
        const uniqueIdIndex = uniqueIdentifierHeader ? parsedData.headers.indexOf(uniqueIdentifierHeader) : -1;
        
        const existingDocs = new Map<string, string>();
        if(uniqueIdIndex > -1) {
            const uniqueIds = parsedData.rows.map(r => r[uniqueIdIndex]).filter(Boolean);
            if (uniqueIds.length > 0) {
                 const q = query(collectionRef, where(config.uniqueIdentifier, 'in', uniqueIds), where('companyId', '==', user.companyId));
                 const snapshot = await getDocs(q);
                 snapshot.forEach(doc => existingDocs.set(doc.data()[config.uniqueIdentifier], doc.id));
            }
        }
        
        const BATCH_SIZE = 400; // Firestore batch limit is 500
        const batches: FirebaseFirestore.WriteBatch[] = [];
        let currentBatch = writeBatch(db);
        let writeCount = 0;

        for(let i=0; i < parsedData.rows.length; i++) {
            const row = parsedData.rows[i];
            if (row.every(cell => cell === null || cell === undefined || cell === '')) {
                continue; // Skip empty rows
            }
            
            const data: { [key: string]: any } = {};
            
            config.allFields.forEach(field => {
                const mappedHeader = fieldMapping[field];
                if (mappedHeader && mappedHeader !== '--skip--') {
                    const headerIndex = parsedData.headers.indexOf(mappedHeader);
                    if (headerIndex > -1) {
                        const value = row[headerIndex];
                         if (value !== undefined && value !== null && value !== '') {
                            const fieldParts = field.split('.');
                            if(fieldParts.length > 1) {
                                if(!data[fieldParts[0]]) data[fieldParts[0]] = {};
                                data[fieldParts[0]][fieldParts[1]] = value;
                            } else {
                                data[field] = value;
                            }
                         }
                    }
                }
            });
            
            const missingFields = config.requiredFields.filter(field => !data[field as string]);
            if (missingFields.length > 0) {
                localErrors.push(`Row ${i + 2}: Missing required fields - ${missingFields.join(', ')}`);
                continue;
            }
            
            const finalData = { ...data, companyId: user.companyId, updatedAt: serverTimestamp() };

            const uniqueIdValue = uniqueIdIndex > -1 ? row[uniqueIdIndex] : undefined;
            const existingDocId = uniqueIdValue ? existingDocs.get(uniqueIdValue) : undefined;
            
            if(existingDocId) {
                const docRef = doc(db, config.collectionName, existingDocId);
                currentBatch.update(docRef, finalData);
            } else {
                finalData.createdAt = serverTimestamp();
                const docRef = doc(collectionRef);
                currentBatch.set(docRef, finalData);
            }

            writeCount++;
            successCount++;

            if(writeCount === BATCH_SIZE) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                writeCount = 0;
            }
        }

        if (writeCount > 0) {
            batches.push(currentBatch);
        }
        
        try {
            await Promise.all(batches.map(b => b.commit()));
            toast({ title: 'Import Complete!', description: `${successCount} records processed.` });
            onImportComplete();
        } catch (error: any) {
            localErrors.push(`A critical error occurred during the database write operation: ${error.message}`);
            toast({ variant: 'destructive', title: 'Import Failed', description: `Could not commit changes to the database.` });
        } finally {
            setImportResult({ success: successCount, failed: localErrors.length, errors: localErrors });
            setIsProcessing(false);
        }
    };


    const renderStepContent = () => {
        switch(activeStep) {
            case 0:
                return (
                    <div 
                        className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg p-12 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FileUp className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Click to Upload your Excel File</h3>
                        <p className="text-muted-foreground mb-4">Or drag and drop your file here.</p>
                        <input
                          ref={fileInputRef}
                          id="import-file"
                          type="file"
                          className="hidden"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileUpload}
                        />
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
                                    {config.allFields.map(field => (
                                        <TableRow key={field as string}>
                                            <TableCell className="font-medium capitalize">
                                                {(field as string).replace(/([A-Z])/g, ' $1').replace('.', ' ')}
                                                {config.requiredFields.includes(field as any) && <span className="text-destructive">*</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Select onValueChange={(value) => handleMappingChange(field.toString(), value)} value={fieldMapping[field.toString()]}>
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
                           Review a preview of your data before starting the import. This shows the first 10 rows.
                        </DialogDescription>
                         <ScrollArea className="h-[400px] border rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        {config.allFields.filter(f => fieldMapping[f.toString()] && fieldMapping[f.toString()] !== '--skip--').map(field => (
                                            <TableHead key={field.toString()} className="capitalize">{(field as string).replace(/([A-Z])/g, ' $1').replace('.', ' ')}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData?.rows.slice(0, 10).map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {config.allFields.filter(f => fieldMapping[f.toString()] && fieldMapping[f.toString()] !== '--skip--').map(field => {
                                                const header = fieldMapping[field.toString()];
                                                const headerIndex = parsedData.headers.indexOf(header);
                                                return <TableCell key={field.toString()}>{String(row[headerIndex] ?? '')}</TableCell>
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
          <DialogTitle>Import {importType === 'assets' ? 'Media Assets' : 'Customers'}</DialogTitle>
           <Stepper activeStep={activeStep} steps={
             [
                { label: 'Upload File' },
                { label: 'Map Fields' },
                { label: 'Preview & Import' },
                { label: 'Results' }
            ]
           }/>
        </DialogHeader>
        <div className="flex-grow overflow-hidden py-4 relative">
            {(isProcessing && activeStep < 3) && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader2 className="w-12 h-12 animate-spin" />
                </div>
            )}
            {renderStepContent()}
        </div>
        <DialogFooter>
            {activeStep === 0 && <DialogClose asChild><Button variant="outline" onClick={resetWizard}>Cancel</Button></DialogClose>}
            {activeStep > 0 && activeStep < 3 && <Button variant="outline" onClick={goToPreviousStep} disabled={isProcessing}>Back</Button>}
            {activeStep === 1 && <Button onClick={() => goToNextStep()} disabled={isProcessing}>Preview Data <ArrowRight className="ml-2 w-4 h-4"/></Button>}
            {activeStep === 2 && <Button onClick={handleImport} disabled={isProcessing}>Start Import <TableIcon className="ml-2 w-4 h-4" /></Button>}
            {activeStep === 3 && <DialogClose asChild><Button onClick={resetWizard}>Done</Button></DialogClose>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    