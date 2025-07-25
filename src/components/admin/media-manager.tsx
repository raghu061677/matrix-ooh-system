
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, SlidersHorizontal, ArrowUpDown, Upload, Download, X } from 'lucide-react';
import exifParser from 'exif-parser';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { statesAndDistricts } from '@/lib/india-states';
import { Asset, sampleAssets } from './media-manager-types';
import { ScrollArea } from '../ui/scroll-area';

type SortConfig = {
  key: keyof Asset;
  direction: 'ascending' | 'descending';
} | null;

export function MediaManager() {
  const [mediaAssets, setMediaAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    image: true,
    mid: true,
    district: true,
    area: true,
    location: true,
    dimensions: true,
    sqft: true,
    light: true,
    status: true,
    structure: false,
    ownership: false,
    media: false,
    state: false,
    city: false,
    supplierId: false,
    latitude: false,
    longitude: false,
    baseRate: true,
    cardRate: true,
  });

  const { toast } = useToast();
  const mediaAssetsCollectionRef = collection(db, 'media_assets');

  useEffect(() => {
    const getMediaAssets = async () => {
      setLoading(true);
      try {
        const data = await getDocs(mediaAssetsCollectionRef);
        const dbAssets = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Asset));
        if (dbAssets.length > 0) {
            setMediaAssets(dbAssets);
        } else {
            setMediaAssets(sampleAssets);
        }
      } catch (e) {
        console.error("Error fetching media assets:", e);
        toast({
            variant: 'destructive',
            title: 'Error fetching assets',
            description: 'Could not retrieve asset data. Using sample data.'
        });
        setMediaAssets(sampleAssets);
      } finally {
        setLoading(false);
      }
    };

    getMediaAssets();
  }, [toast]);
  
  useEffect(() => {
    const { structure, width1, height1, width2, height2 } = formData;
    let totalSqft = 0;
    if (structure === 'single' && width1 && height1) {
      totalSqft = width1 * height1;
    } else if (structure === 'multi' && width1 && height1 && width2 && height2) {
      totalSqft = (width1 * height1) + (width2 * height2);
    } else if (structure === 'multi' && width1 && height1) {
      totalSqft = width1 * height1;
    }
    setFormData(prev => ({ ...prev, sqft: totalSqft > 0 ? parseFloat(totalSqft.toFixed(2)) : undefined }));
  }, [formData.structure, formData.width1, formData.height1, formData.width2, formData.height2]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || undefined : value }));
  };

  const handleSelectChange = (name: keyof Asset, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleStateChange = (value: string) => {
    setFormData(prev => ({...prev, state: value, district: undefined }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!currentAsset?.id) {
        toast({
            variant: 'destructive',
            title: 'Save Asset First',
            description: 'Please save the asset details before uploading images.',
        });
        return;
    }
    
    setIsUploading(true);
    toast({ title: `Uploading ${files.length} image(s)...`, description: 'Please wait.' });
    
    const assetId = currentAsset.id;
    const uploadedUrls: string[] = [];

    // Attempt to extract EXIF from the first file
    try {
        const firstFile = files[0];
        const buffer = await firstFile.arrayBuffer();
        const parser = exifParser.create(buffer);
        const result = parser.parse();
        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
            setFormData(prev => ({
                ...prev,
                latitude: result.tags.GPSLatitude,
                longitude: result.tags.GPSLongitude,
            }));
            toast({
                title: 'Coordinates Found!',
                description: 'GPS data has been extracted from the image.',
            });
        }
    } catch (error) {
        console.warn('Could not parse EXIF data or no data found:', error);
    }

    // Upload all files
    for (const file of Array.from(files)) {
      const imageRef = ref(storage, `media-assets/${assetId}/${file.name}_${Date.now()}`);
      try {
        await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(imageRef);
        uploadedUrls.push(downloadURL);
      } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
      }
    }
    
    if (uploadedUrls.length > 0) {
        const assetDoc = doc(db, 'media_assets', assetId);
        await updateDoc(assetDoc, { imageUrls: arrayUnion(...uploadedUrls) });
        
        const newImageUrls = [...(formData.imageUrls || []), ...uploadedUrls];
        setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));
        
        // Also update the main state to reflect changes in the table
        setMediaAssets(prev => prev.map(a => a.id === assetId ? { ...a, imageUrls: newImageUrls } : a));
    }

    setIsUploading(false);
    toast({ title: 'Upload complete!', description: `${uploadedUrls.length} of ${files.length} image(s) have been added.` });
    
    // Clear the file input
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageUrlToDelete: string) => {
    if (!currentAsset?.id) return;
    setIsUploading(true);
    toast({ title: 'Deleting image...', description: 'Please wait.' });

    try {
        const assetId = currentAsset.id;
        const imageRef = ref(storage, imageUrlToDelete);
        await deleteObject(imageRef);

        const assetDoc = doc(db, 'media_assets', assetId);
        await updateDoc(assetDoc, { imageUrls: arrayRemove(imageUrlToDelete) });

        const updatedImageUrls = formData.imageUrls?.filter(url => url !== imageUrlToDelete);
        setFormData(prev => ({ ...prev, imageUrls: updatedImageUrls }));
        
        setMediaAssets(prev => prev.map(a => a.id === assetId ? { ...a, imageUrls: updatedImageUrls } : a));
        
        toast({ title: 'Image deleted!', description: 'The image has been removed successfully.' });
    } catch(error) {
        console.error("Error deleting image: ", error);
        toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not delete the image. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Create a clean data object by removing undefined values
    const dataToSave = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined));

    if (currentAsset?.id) {
      const assetDoc = doc(db, 'media_assets', currentAsset.id);
      await updateDoc(assetDoc, dataToSave);

      const updatedAsset = { ...currentAsset, ...dataToSave };
      setMediaAssets(mediaAssets.map(asset => 
        asset.id === currentAsset.id ? updatedAsset : asset
      ));
      setCurrentAsset(updatedAsset);
      toast({ title: 'Asset Updated!', description: 'The media asset details have been saved.' });
    } else {
      const docRef = await addDoc(mediaAssetsCollectionRef, { ...dataToSave, imageUrls: [] });
      const newAsset = { ...dataToSave, imageUrls: [], id: docRef.id } as Asset;

      setMediaAssets(prev => [...prev, newAsset]);
      setCurrentAsset(newAsset);
      setFormData(newAsset);
      toast({ title: 'Asset Added!', description: 'You can now upload images to this asset.' });
    }
    
    setIsSaving(false);
  };

  const openDialog = (asset: Asset | null = null) => {
    setCurrentAsset(asset);
    setFormData(asset || { mid: `ASSET-${Date.now().toString().slice(-6)}`});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentAsset(null);
    setFormData({});
    setIsSaving(false);
    setIsUploading(false);
  };
  
  const handleDelete = async (asset: Asset) => {
     if(!confirm(`Are you sure you want to delete asset ${asset.mid} (${asset.location})?`)) return;
     const assetDoc = doc(db, 'media_assets', asset.id);
     await deleteDoc(assetDoc);
     setMediaAssets(mediaAssets.filter(a => a.id !== asset.id));
     toast({ title: 'Asset Deleted', description: `${asset.location} has been removed.` });
  };
  
  const requestSort = (key: keyof Asset) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredAssets = useMemo(() => {
    let sortableAssets = [...mediaAssets];
    if (filter) {
      sortableAssets = sortableAssets.filter(asset =>
        Object.values(asset).some(val => 
          String(val).toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
    if (sortConfig !== null) {
      sortableAssets.sort((a, b) => {
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
    return sortableAssets;
  }, [mediaAssets, filter, sortConfig]);

  const getSortIcon = (key: keyof Asset) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />; 
  };
  
  const columns: { key: keyof typeof columnVisibility, label: string, sortable?: boolean }[] = [
    { key: 'image', label: 'Image' },
    { key: 'mid', label: 'MID', sortable: true },
    { key: 'district', label: 'District', sortable: true },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'sqft', label: 'Sqft' },
    { key: 'light', label: 'Lighting' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'structure', label: 'Structure', sortable: true },
    { key: 'ownership', label: 'Ownership', sortable: true },
    { key: 'media', label: 'Media', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'supplierId', label: 'Supplier ID' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'baseRate', label: 'Base Rate' },
    { key: 'cardRate', label: 'Card Rate' },
  ];

  const exportTemplateToExcel = () => {
    const headers = [
      'mid', 'ownership', 'media', 'state', 'district', 'city', 'area', 'location', 
      'dimensions', 'structure', 'width1', 'height1', 'width2', 'height2', 'sqft', 'light', 'status', 'supplierId',
      'latitude', 'longitude', 'baseRate', 'cardRate'
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Assets Template');
    XLSX.writeFile(workbook, 'media-assets-template.xlsx');
  };
  
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedAndFilteredAssets);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Assets');
    XLSX.writeFile(workbook, 'media-assets.xlsx');
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text('Media Assets', 20, 10);
    (doc as any).autoTable({
      head: [columns.filter(c => c.key !== 'image' && columnVisibility[c.key]).map(c => c.label)],
      body: sortedAndFilteredAssets.map(asset => 
        columns.filter(c => c.key !== 'image' && columnVisibility[c.key]).map(col => {
            return asset[col.key as keyof Asset] ?? '';
        })
      ),
    });
    doc.save('media-assets.pdf');
  };

  const exportToPpt = () => {
    const pptx = new PptxGenJS();
    sortedAndFilteredAssets.forEach(asset => {
      const slide = pptx.addSlide();
      slide.addText(`Media Asset: ${asset.mid || 'N/A'}`, { x: 0.5, y: 0.5, fontSize: 18, bold: true });
      let y = 1.0;
      columns.forEach(col => {
        if (col.key !== 'image' && columnVisibility[col.key] && asset[col.key as keyof Asset]) {
           let value = asset[col.key as keyof Asset];
           if (value) {
            slide.addText(`${col.label}: ${value}`, { x: 0.5, y, fontSize: 12 });
            y += 0.4;
           }
        }
      });
      if (asset.imageUrls && asset.imageUrls[0]) {
         slide.addImage({ path: asset.imageUrls[0], x: 6, y: 1, w: 3, h: 2 });
      }
    });
    pptx.writeFile({ fileName: 'media-assets.pptx' });
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
        const json = XLSX.utils.sheet_to_json(worksheet);

        setLoading(true);
        for (const item of json) {
            await addDoc(mediaAssetsCollectionRef, item);
        }
        
        const updatedData = await getDocs(mediaAssetsCollectionRef);
        setMediaAssets(updatedData.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Asset)));
        setLoading(false);
        toast({ title: 'Import Successful', description: `${json.length} assets have been imported.` });
    };
    reader.readAsBinaryString(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const uniqueAreas = useMemo(() => {
    const areas = new Set(mediaAssets.map(asset => asset.area).filter(Boolean));
    return Array.from(areas).sort();
  }, [mediaAssets]);


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
            placeholder="Filter assets..."
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
                <TooltipContent>Export Assets</TooltipContent>
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
            Add New Asset
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
                     <Button variant="ghost" onClick={() => requestSort(col.key as keyof Asset)}>
                       {col.label}
                       {getSortIcon(col.key as keyof Asset)}
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
            {sortedAndFilteredAssets.map(asset => (
              <TableRow key={asset.id}>
                 {columnVisibility.image && <TableCell>
                  {asset.imageUrls && asset.imageUrls.length > 0 ? (
                    <Image
                      src={asset.imageUrls[0]}
                      alt={asset.location || 'Asset image'}
                      width={64}
                      height={64}
                      className="rounded-md object-cover h-16 w-16"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                       <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>}
                {columnVisibility.mid && <TableCell className="font-medium">{asset.mid}</TableCell>}
                {columnVisibility.district && <TableCell>{asset.district}</TableCell>}
                {columnVisibility.area && <TableCell>{asset.area}</TableCell>}
                {columnVisibility.location && <TableCell>{asset.location}</TableCell>}
                {columnVisibility.dimensions && <TableCell>{asset.dimensions}</TableCell>}
                {columnVisibility.sqft && <TableCell>{asset.sqft}</TableCell>}
                {columnVisibility.light && <TableCell>{asset.light}</TableCell>}
                {columnVisibility.status && <TableCell>{asset.status}</TableCell>}
                {columnVisibility.structure && <TableCell>{asset.structure}</TableCell>}
                {columnVisibility.ownership && <TableCell>{asset.ownership}</TableCell>}
                {columnVisibility.media && <TableCell>{asset.media}</TableCell>}
                {columnVisibility.state && <TableCell>{asset.state}</TableCell>}
                {columnVisibility.city && <TableCell>{asset.city}</TableCell>}
                {columnVisibility.supplierId && <TableCell>{asset.supplierId}</TableCell>}
                {columnVisibility.latitude && <TableCell>{asset.latitude}</TableCell>}
                {columnVisibility.longitude && <TableCell>{asset.longitude}</TableCell>}
                {columnVisibility.baseRate && <TableCell>{asset.baseRate}</TableCell>}
                {columnVisibility.cardRate && <TableCell>{asset.cardRate}</TableCell>}

                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(asset)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(asset)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentAsset?.id ? 'Edit Media Asset' : 'Add New Media Asset'}</DialogTitle>
            <DialogDescription>
              {currentAsset?.id ? 'Update the details for this media asset.' : 'Fill in the details for the new media asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
                  <div>
                    <Label htmlFor="mid">MID</Label>
                    <Input id="mid" name="mid" value={formData.mid || ''} onChange={handleFormChange}/>
                  </div>
                  <div>
                    <Label htmlFor="ownership">Ownership</Label>
                     <Select onValueChange={(value) => handleSelectChange('ownership', value)} value={formData.ownership}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ownership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own">Own</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="media">Media Type</Label>
                     <Select onValueChange={(value) => handleSelectChange('media', value)} value={formData.media}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select media type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bus Shelter">Bus Shelter</SelectItem>
                        <SelectItem value="Center Median">Center Median</SelectItem>
                        <SelectItem value="Cantilever">Cantilever</SelectItem>
                        <SelectItem value="Hoarding">Hoarding</SelectItem>
                        <SelectItem value="Unipole">Unipole</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                     <Label htmlFor="state">State</Label>
                    <Select onValueChange={handleStateChange} value={formData.state}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {statesAndDistricts.states.map(state => (
                          <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange('district', value)}
                      value={formData.district}
                      disabled={!formData.state}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.state && statesAndDistricts.states.find(s => s.name === formData.state)?.districts.map(district => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city || ''} onChange={handleFormChange} />
                  </div>
                   
                   <div className="md:col-span-2">
                    <Label htmlFor="area">Area</Label>
                    <div className="flex gap-2">
                        <Select onValueChange={(value) => handleSelectChange('area', value)} value={formData.area}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select existing area" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueAreas.map(area => (
                                    <SelectItem key={area} value={area}>{area}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input id="area" name="area" placeholder="Or add new area" value={formData.area || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location || ''} onChange={handleFormChange} required />
                  </div>

                   <div className="md:col-span-2">
                    <Label htmlFor="dimensions">Dimensions (e.g. 14' x 48')</Label>
                    <Input id="dimensions" name="dimensions" value={formData.dimensions || ''} onChange={handleFormChange} />
                  </div>

                  <div>
                    <Label htmlFor="structure">Structure</Label>
                     <Select onValueChange={(value) => handleSelectChange('structure', value as 'single' | 'multi')} value={formData.structure}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Structure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Display</SelectItem>
                        <SelectItem value="multi">Multi Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sqft">Total Sqft</Label>
                    <Input id="sqft" name="sqft" type="number" value={formData.sqft || ''} readOnly className="bg-muted" />
                  </div>
                  
                  {formData.structure === 'single' && (
                    <>
                       <div>
                        <Label htmlFor="width1">Width (ft)</Label>
                        <Input id="width1" name="width1" type="number" value={formData.width1 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="height1">Height (ft)</Label>
                        <Input id="height1" name="height1" type="number" value={formData.height1 || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}
                  {formData.structure === 'multi' && (
                     <>
                       <div>
                        <Label htmlFor="width1">Width 1 (ft)</Label>
                        <Input id="width1" name="width1" type="number" value={formData.width1 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="height1">Height 1 (ft)</Label>
                        <Input id="height1" name="height1" type="number" value={formData.height1 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="width2">Width 2 (ft)</Label>
                        <Input id="width2" name="width2" type="number" value={formData.width2 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="height2">Height 2 (ft)</Label>
                        <Input id="height2" name="height2" type="number" value={formData.height2 || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}


                  <div className="flex flex-col gap-2">
                    <Label htmlFor="light">Lighting</Label>
                     <Select onValueChange={(value) => handleSelectChange('light', value as any)} value={formData.light}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lighting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BackLit">Back-Lit</SelectItem>
                        <SelectItem value="Non-Lit">Non-Lit</SelectItem>
                        <SelectItem value="Front-Lit">Front-Lit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                     <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="deleted">Deleted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplierId">Supplier ID</Label>
                    <Input id="supplierId" name="supplierId" value={formData.supplierId || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" name="latitude" type="number" value={formData.latitude || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" name="longitude" type="number" value={formData.longitude || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="baseRate">Base Rate (per month)</Label>
                    <Input id="baseRate" name="baseRate" type="number" value={formData.baseRate || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="cardRate">Card Rate (per month)</Label>
                    <Input id="cardRate" name="cardRate" type="number" value={formData.cardRate || ''} onChange={handleFormChange} />
                  </div>
                   <div className="col-span-full">
                    <Label htmlFor="images">Asset Images</Label>
                    <Input ref={imageInputRef} id="images" type="file" multiple onChange={handleImageFileChange} disabled={!currentAsset?.id || isUploading}/>
                     <p className="text-sm text-muted-foreground mt-1">
                       New images will be added to existing ones. GPS data will be extracted from the first image if available.
                    </p>
                    {isUploading && <Loader2 className="animate-spin mt-2" />}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(formData.imageUrls || []).map((url: string) => (
                        <div key={url} className="relative h-20 w-20 group">
                          <Image src={url} alt="Asset image" layout="fill" className="rounded-md object-cover" />
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage(url)}
                              disabled={isUploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={closeDialog}>Close</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : 'Save Details'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
