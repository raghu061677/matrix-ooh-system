
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, SlidersHorizontal, ArrowUpDown, Upload, Download } from 'lucide-react';
import exifParser from 'exif-parser';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { statesAndDistricts } from '@/lib/india-states';


type Asset = {
  id: string; // Document ID from Firestore
  mid?: string;
  ownership?: 'own' | 'rented';
  media?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  location?: string;
  dimensions?: string;
  structure?: 'single' | 'multi';
  width1?: number;
  height1?: number;
  width2?: number;
  height2?: number;
  sqft?: number;
  light?: 'BackLit' | 'Non-Lit' | 'Front-Lit';
  status?: 'active' | 'deleted';
  supplierId?: string; // Reference to suppliers collection
  contractDetails?: {
    ownerName: string;
    contractStartDate: Date;
    contractEndDate: Date;
  };
  imageUrls?: string[];
};

type SortConfig = {
  key: keyof Asset;
  direction: 'ascending' | 'descending';
} | null;


export function MediaManager() {
  const [mediaAssets, setMediaAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    structure: true,
    ownership: false,
    media: false,
    state: false,
    city: false,
    supplierId: false,
  });

  const { toast } = useToast();
  const mediaAssetsCollectionRef = collection(db, 'media_assets');

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    const getMediaAssets = async () => {
      setLoading(true);
      const data = await getDocs(mediaAssetsCollectionRef);
      setMediaAssets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Asset)));
      setLoading(false);
    };

    getMediaAssets();
  }, []);
  
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
    setFormData(prev => ({ ...prev, sqft: totalSqft }));
  }, [formData.structure, formData.width1, formData.height1, formData.width2, formData.height2]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: keyof Asset, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleStateChange = (value: string) => {
    setFormData(prev => ({...prev, state: value, district: undefined }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageFiles(files);

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const buffer = event.target?.result;
        if (buffer instanceof ArrayBuffer) {
            try {
                const parser = exifParser.create(buffer);
                const result = parser.parse();
                if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
                    setLatitude(result.tags.GPSLatitude.toString());
                    setLongitude(result.tags.GPSLongitude.toString());
                    toast({
                        title: 'Coordinates Found!',
                        description: 'GPS data extracted from image.',
                    });
                }
            } catch (error) {
                console.warn('Could not parse EXIF data:', error);
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleImageUpload = async () => {
    if (!imageFiles) return [];
    
    const imageUrls: string[] = [];
    for (const file of Array.from(imageFiles)) {
      const imageRef = ref(storage, `media-assets/${file.name}_${Date.now()}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      imageUrls.push(downloadURL);
    }
    return imageUrls;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const assetData: Partial<Asset> = { ...formData };
    
    const newImageUrls = await handleImageUpload();
    if (newImageUrls.length > 0) {
      assetData.imageUrls = [...(currentAsset?.imageUrls || []), ...newImageUrls];
    } else {
      assetData.imageUrls = currentAsset?.imageUrls || [];
    }

    if (currentAsset) {
      const assetDoc = doc(db, 'media_assets', currentAsset.id);
      await updateDoc(assetDoc, assetData);
      setMediaAssets(mediaAssets.map(asset => asset.id === currentAsset.id ? { ...asset, ...assetData, id: currentAsset.id } : asset));
      toast({ title: 'Asset Updated!', description: 'The media asset has been successfully updated.' });
    } else {
      const docRef = await addDoc(mediaAssetsCollectionRef, assetData);
      setMediaAssets([...mediaAssets, { ...assetData, id: docRef.id } as Asset]);
      toast({ title: 'Asset Added!', description: 'The new media asset has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (asset: Asset | null = null) => {
    setCurrentAsset(asset);
    setFormData(asset || {});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentAsset(null);
    setFormData({});
    setImageFiles(null);
    setLatitude('');
    setLongitude('');
  };
  
  const handleDelete = async (asset: Asset) => {
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
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown className="ml-2 h-4 w-4" />; 
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
  ];

  const exportTemplateToExcel = () => {
    const headers = [
      'mid', 'ownership', 'media', 'state', 'district', 'city', 'area', 'location', 
      'dimensions', 'structure', 'width1', 'height1', 'width2', 'height2', 'sqft', 'light', 'status', 'supplierId'
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
      head: [columns.filter(c => c.key !== 'image').map(c => c.label)],
      body: sortedAndFilteredAssets.map(asset => 
        columns.filter(c => c.key !== 'image').map(col => {
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
        if (col.key !== 'image' && asset[col.key as keyof Asset]) {
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentAsset ? 'Edit Media Asset' : 'Add New Media Asset'}</DialogTitle>
            <DialogDescription>
              {currentAsset ? 'Update the details for this media asset.' : 'Fill in the details for the new media asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
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
               <div>
                <Label htmlFor="area">Area</Label>
                <Input id="area" name="area" value={formData.area || ''} onChange={handleFormChange} />
              </div>
              <div className="md:col-span-3">
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
               <div className="col-span-full">
                <Label htmlFor="images">Asset Images</Label>
                <Input id="images" type="file" multiple onChange={handleImageChange} />
                 <p className="text-sm text-muted-foreground mt-1">
                   New images will be added to existing ones.
                </p>
                {currentAsset?.imageUrls && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentAsset.imageUrls.map((url: string) => (
                      <div key={url} className="relative h-20 w-20">
                        <Image src={url} alt="Asset image" layout="fill" className="rounded-md object-cover" />
                      </div>
                    ))}
                  </div>
                )}
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
