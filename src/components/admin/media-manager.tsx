
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, MoreHorizontal, X, Upload, ArrowUpDown, Settings, FileDown, MapPin, LayoutGrid } from 'lucide-react';
import { Asset, AssetStatus, AssetOwnership, mediaTypes, lightTypes, AssetLightType } from './media-manager-types';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '../ui/switch';
import { statesAndDistricts } from '@/lib/india-states';
import { Card, CardContent, CardHeader } from '../ui/card';
import imageCompression from 'browser-image-compression';
import ExifParser from 'exif-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import * as XLSX from 'xlsx';


type SortConfig = {
  key: keyof Asset;
  direction: 'ascending' | 'descending';
} | null;

export function MediaManager() {
  const { user } = useAuth();
  const [mediaAssets, setMediaAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapAsset, setMapAsset] = useState<Asset | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnVisibility, setColumnVisibility] = useState({
      image: true,
      iid: true,
      name: true,
      state: true,
      district: true,
      area: true,
      location: true,
      direction: true,
      media: true,
      lightType: true,
      dimensions: true,
      totalSqft: true,
      cardRate: true,
      status: true,
      map: true,
  });


  const { toast } = useToast();
  const mediaAssetsCollectionRef = collection(db, 'mediaAssets');

  const getMediaAssets = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
        const q = query(mediaAssetsCollectionRef, where("companyId", "==", user.companyId));
        const data = await getDocs(q);
        if (!data.empty) {
            setMediaAssets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Asset)));
        } else {
             setMediaAssets([]);
        }
    } catch(e) {
         console.error("Error fetching media assets:", e);
         toast({
            variant: 'destructive',
            title: 'Error fetching assets',
            description: 'Could not retrieve asset data.'
        });
        setMediaAssets([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if(user) {
      getMediaAssets();
    }
  }, [user]);

  const requestSort = (key: keyof Asset) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'dimensions') {
        const updatedFormData: Partial<Asset> = { dimensions: value };
        
        // Check for multi-face format like "25x5-12x3"
        if (value.includes('-')) {
            const [face1Dim, face2Dim] = value.split('-');
            updatedFormData.multiface = true;
            
            if (face1Dim) {
                const parts1 = face1Dim.split(/x|X/);
                const width1 = parseFloat(parts1[0]) || 0;
                const height1 = parseFloat(parts1[1]) || 0;
                updatedFormData.size = { width: width1, height: height1 };
                updatedFormData.totalSqft = width1 * height1;
            }
            
            if (face2Dim) {
                const parts2 = face2Dim.split(/x|X/);
                const width2 = parseFloat(parts2[0]) || 0;
                const height2 = parseFloat(parts2[1]) || 0;
                updatedFormData.size2 = { width: width2, height: height2 };
                updatedFormData.totalSqft2 = width2 * height2;
            }

        } else { // Single face
            const parts = value.split(/x|X/);
            const width = parseFloat(parts[0]) || 0;
            const height = parseFloat(parts[1]) || 0;
            updatedFormData.size = { width, height };
            updatedFormData.totalSqft = width * height;
            updatedFormData.multiface = false;
        }

        setFormData(prev => ({ ...prev, ...updatedFormData }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>, face: 1 | 2) => {
    const { name, value } = e.target;
    const sizeKey = face === 1 ? 'size' : 'size2';
    const sqftKey = face === 1 ? 'totalSqft' : 'totalSqft2';

    const newSize = { ...(formData[sizeKey] || {}), [name]: parseFloat(value) || 0 };
    const totalSqft = (newSize.width || 0) * (newSize.height || 0);

    setFormData(prev => {
        const updatedData = {
            ...prev,
            [sizeKey]: newSize,
            [sqftKey]: totalSqft > 0 ? totalSqft : 0
        };

        const face1Dim = `${updatedData.size?.width || 0}x${updatedData.size?.height || 0}`;
        if (updatedData.multiface) {
            const face2Dim = `${updatedData.size2?.width || 0}x${updatedData.size2?.height || 0}`;
            updatedData.dimensions = `${face1Dim}-${face2Dim}`;
        } else {
            updatedData.dimensions = face1Dim;
        }

        return updatedData;
    });
  };

  const handleSelectChange = (name: keyof Asset, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (name === 'state') {
        setFormData(prev => ({...prev, district: undefined})); // Reset district on state change
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles: File[] = [];
    const compressionOptions = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    }

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit before compression
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `${file.name} is over 5MB. Please select a smaller file.`,
        });
        continue;
      }

      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        validFiles.push(compressedFile);

        // Check for GPS data in EXIF
        const arrayBuffer = await file.arrayBuffer(); // use original file for exif
        const parser = ExifParser.create(arrayBuffer);
        const result = parser.parse();
        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
           setFormData(prev => ({
              ...prev,
              latitude: result.tags.GPSLatitude,
              longitude: result.tags.GPSLongitude,
           }));
           toast({ title: 'Geotag Found!', description: `Coordinates updated from ${file.name}.` });
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Compression Failed', description: `Could not process ${file.name}.` });
         console.error('Compression error:', error);
      }
    }
    
    setNewImageFiles(prev => [...prev, ...validFiles]);

    // Clear file input
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };


  const handleDeleteImage = async (imageUrlToDelete: string, isNew: boolean) => {
      if (isNew) {
        // It's a file object, just remove from state
        setNewImageFiles(prev => prev.filter(file => URL.createObjectURL(file) !== imageUrlToDelete));
        return;
      }

    // It's an existing URL, delete from Storage
    if (!currentAsset?.id || !imageUrlToDelete) return;

    setIsSaving(true);
    toast({ title: 'Deleting image...', description: 'Please wait.' });

    try {
        const imageRef = ref(storage, imageUrlToDelete);
        await deleteObject(imageRef);

        const updatedImageUrls = (formData.imageUrls || []).filter(url => url !== imageUrlToDelete);
        const assetDoc = doc(db, 'mediaAssets', currentAsset.id);
        await updateDoc(assetDoc, { imageUrls: updatedImageUrls });

        setFormData(prev => ({ ...prev, imageUrls: updatedImageUrls }));
        
        await getMediaAssets();
        toast({ title: 'Image deleted!', description: 'The image has been removed successfully.' });
    } catch(error) {
        console.error("Error deleting image: ", error);
        toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not delete the image. Please try again.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.companyId || !user?.uid) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'User company or ID not found.' });
      return;
    }

    setIsSaving(true);
    let assetId = currentAsset?.id;
    
    try {
      // Step 1: Uniqueness check
      if (formData.iid && formData.iid !== currentAsset?.iid) {
          const iidQuery = query(mediaAssetsCollectionRef, where("companyId", "==", user.companyId), where("iid", "==", formData.iid));
          const iidSnapshot = await getDocs(iidQuery);
          if (!iidSnapshot.empty) {
                throw new Error(`An asset with the code "${formData.iid}" already exists.`);
          }
      }
      if (formData.location && formData.location !== currentAsset?.location) {
          const locationQuery = query(mediaAssetsCollectionRef, where("companyId", "==", user.companyId), where("location", "==", formData.location));
          const locationSnapshot = await getDocs(locationQuery);
          if (!locationSnapshot.empty) {
            throw new Error(`An asset with the location "${formData.location}" already exists.`);
          }
      }

      // Step 2: Prepare asset data
      const { id: _, ...dataToSave} = formData;
      const existingImageUrls = currentAsset?.imageUrls || [];
      let docRef;

      if (assetId) {
        // Update existing asset's text data
        docRef = doc(db, 'mediaAssets', assetId);
        await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp(), companyId: user.companyId });
      } else {
        // Create new asset to get an ID
        docRef = await addDoc(mediaAssetsCollectionRef, { ...dataToSave, createdAt: serverTimestamp(), companyId: user.companyId, imageUrls: [] });
        assetId = docRef.id;
      }
      
      // Step 3: Upload new images if any
      if (newImageFiles.length > 0 && assetId) {
        toast({ title: `Uploading ${newImageFiles.length} image(s)...` });
        const uploadPromises = newImageFiles.map(file => {
          const imageRef = ref(storage, `mediaAssets/${assetId}/${Date.now()}-${file.name}`);
          return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
        });

        const newImageUrls = await Promise.all(uploadPromises);

        // Step 4: Final update with combined image URLs
        const finalImageUrls = [...existingImageUrls, ...newImageUrls];
        await updateDoc(docRef, { imageUrls: finalImageUrls });
        setFormData(prev => ({...prev, imageUrls: finalImageUrls}));
      }

      await getMediaAssets();
      toast({ title: 'Asset Saved!', description: 'The media asset has been successfully saved.' });
      closeDialog();

    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save asset details.' });
    } finally {
      setIsSaving(false);
    }
  };


  const openDialog = (asset: Asset | null = null) => {
    setCurrentAsset(asset);
    setFormData(asset || { name: '', location: '', status: 'active', ownership: 'own', companyId: user?.companyId, multiface: false });
    setNewImageFiles([]);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentAsset(null);
    setFormData({});
    setNewImageFiles([]);
    setIsSaving(false);
  };
  
  const handleDelete = async (assetToDelete: Asset) => {
     if(!confirm(`Are you sure you want to delete asset ${assetToDelete.location}?`)) return;
     const assetDoc = doc(db, 'mediaAssets', assetToDelete.id);
     await deleteDoc(assetDoc);
     await getMediaAssets();
     toast({ title: 'Asset Deleted', description: `${assetToDelete.location} has been removed.` });
  };
  
  const sortedAndFilteredAssets = useMemo(() => {
    let sortableAssets = [...mediaAssets];

    if (filter) {
      sortableAssets = sortableAssets.filter(asset => {
        const searchTerm = filter.toLowerCase();
        return (
          asset.district?.toLowerCase().includes(searchTerm) ||
          asset.area?.toLowerCase().includes(searchTerm) ||
          asset.location?.toLowerCase().includes(searchTerm) ||
          asset.direction?.toLowerCase().includes(searchTerm)
        );
      });
    }

    if (sortConfig !== null) {
      sortableAssets.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
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

  const combinedSqft = useMemo(() => {
    const sqft1 = formData.totalSqft || 0;
    const sqft2 = formData.multiface ? (formData.totalSqft2 || 0) : 0;
    return sqft1 + sqft2;
  }, [formData.totalSqft, formData.totalSqft2, formData.multiface]);

  const handleExport = (sample = false) => {
    const headers = [
        "iid", "name", "state", "district", "area", "location", "direction",
        "latitude", "longitude", "media", "lightType", "status", "ownership",
        "dimensions", "multiface", "cardRate", "baseRate", "rate",
        "size.width", "size.height", "totalSqft",
        "size2.width", "size2.height", "totalSqft2"
    ];

    let dataToExport;

    if (sample) {
        dataToExport = [{
            iid: 'HYD-001', name: 'Sample Location', state: 'Telangana', district: 'Hyderabad',
            area: 'Sample Area', location: 'Sample Location Description', direction: 'Towards X',
            latitude: 17.3850, longitude: 78.4867, media: 'Hoarding', lightType: 'Front Lit',
            status: 'active', ownership: 'own', dimensions: '40x30-20x10', multiface: true,
            cardRate: 50000, baseRate: 40000, rate: 45000,
            'size.width': 40, 'size.height': 30, totalSqft: 1200,
            'size2.width': 20, 'size2.height': 10, totalSqft2: 200,
        }];
    } else {
        dataToExport = sortedAndFilteredAssets.map(asset => ({
            iid: asset.iid, name: asset.name, state: asset.state, district: asset.district,
            area: asset.area, location: asset.location, direction: asset.direction,
            latitude: asset.latitude, longitude: asset.longitude, media: asset.media, lightType: asset.lightType,
            status: asset.status, ownership: asset.ownership, dimensions: asset.dimensions, multiface: asset.multiface,
            cardRate: asset.cardRate, baseRate: asset.baseRate, rate: asset.rate,
            'size.width': asset.size?.width,
            'size.height': asset.size?.height,
            totalSqft: asset.totalSqft,
            'size2.width': asset.size2?.width,
            'size2.height': asset.size2?.height,
            totalSqft2: asset.totalSqft2
        }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Assets');
    XLSX.writeFile(workbook, sample ? 'sample-media-assets.xlsx' : 'media-assets-export.xlsx');
};
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.companyId) return;

    setIsSaving(true);
    toast({ title: 'Importing assets...', description: 'Please wait.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            let successCount = 0;
            for (const item of json) {
                 const newAsset: Partial<Asset> = {
                    ...item,
                    companyId: user.companyId,
                    createdAt: serverTimestamp(),
                    size: { width: item['size.width'], height: item['size.height'] },
                    size2: item.multiface ? { width: item['size2.width'], height: item['size2.height'] } : undefined,
                    imageUrls: [],
                 };
                 // Clean up flattened keys
                 delete (newAsset as any)['size.width'];
                 delete (newAsset as any)['size.height'];
                 delete (newAsset as any)['size2.width'];
                 delete (newAsset as any)['size2.height'];

                 await addDoc(mediaAssetsCollectionRef, newAsset);
                 successCount++;
            }
            toast({ title: 'Import Complete!', description: `${successCount} assets were imported.`});
            await getMediaAssets();

        } catch (error) {
            console.error("Import error:", error);
            toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not import assets. Please check file format.'});
        } finally {
            setIsSaving(false);
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };
    reader.readAsBinaryString(file);
  };
  
  const openMapDialog = (asset: Asset) => {
    setMapAsset(asset);
    setIsMapDialogOpen(true);
  }

  const getAssetTotalSqft = (asset: Asset | null) => {
    if (!asset) return 0;
    const sqft1 = asset.totalSqft || 0;
    const sqft2 = asset.multiface ? (asset.totalSqft2 || 0) : 0;
    return sqft1 + sqft2;
  };


  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const renderSortableHeader = (label: string, key: keyof Asset) => (
    <TableHead>
        <Button variant="ghost" onClick={() => requestSort(key)}>
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    </TableHead>
  );

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <LayoutGrid />
          Media Manager
        </h1>
      </div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
           <Input
            placeholder="Filter by district, area, location, direction..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.keys(columnVisibility).map(key => (
                        <DropdownMenuCheckboxItem
                            key={key}
                            className="capitalize"
                            checked={columnVisibility[key as keyof typeof columnVisibility]}
                            onCheckedChange={value =>
                                setColumnVisibility(prev => ({...prev, [key]: !!value}))
                            }
                            onSelect={(e) => e.preventDefault()}
                        >
                            {key.replace(/([A-Z])/g, ' $1')}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                       <FileDown className="mr-2" />
                        {isSaving ? <Loader2 className="animate-spin" /> : 'Data'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleExport(false)}>Export Current View</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport(true)}>Download Sample File</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => importInputRef.current?.click()}>Import from Excel</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
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
              {columnVisibility.image && <TableHead>Image</TableHead>}
              {columnVisibility.iid && renderSortableHeader('Media ID', 'iid')}
              {columnVisibility.name && renderSortableHeader('Name', 'name')}
              {columnVisibility.state && renderSortableHeader('State', 'state')}
              {columnVisibility.district && renderSortableHeader('District', 'district')}
              {columnVisibility.area && renderSortableHeader('Area', 'area')}
              {columnVisibility.location && <TableHead>Location</TableHead>}
              {columnVisibility.direction && <TableHead>Direction</TableHead>}
              {columnVisibility.media && renderSortableHeader('Media Type', 'media')}
              {columnVisibility.lightType && renderSortableHeader('Light Type', 'lightType')}
              {columnVisibility.dimensions && <TableHead>Dimension</TableHead>}
              {columnVisibility.totalSqft && renderSortableHeader('SQFT', 'totalSqft')}
              {columnVisibility.cardRate && renderSortableHeader('Card Rate', 'cardRate')}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.map && <TableHead>Map</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredAssets.map(asset => (
              <TableRow key={asset.id}>
                 {columnVisibility.image && <TableCell>
                  {asset.imageUrls?.[0] ? (
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
                {columnVisibility.iid && <TableCell>{asset.iid}</TableCell>}
                {columnVisibility.name && <TableCell>{asset.name}</TableCell>}
                {columnVisibility.state && <TableCell>{asset.state}</TableCell>}
                {columnVisibility.district && <TableCell>{asset.district}</TableCell>}
                {columnVisibility.area && <TableCell>{asset.area}</TableCell>}
                {columnVisibility.location && <TableCell className="max-w-[200px] truncate">{asset.location}</TableCell>}
                {columnVisibility.direction && <TableCell>{asset.direction}</TableCell>}
                {columnVisibility.media && <TableCell>{asset.media}</TableCell>}
                {columnVisibility.lightType && <TableCell>{asset.lightType}</TableCell>}
                {columnVisibility.dimensions && <TableCell>{asset.dimensions}</TableCell>}
                {columnVisibility.totalSqft && <TableCell>{getAssetTotalSqft(asset)}</TableCell>}
                {columnVisibility.cardRate && <TableCell>{asset.cardRate?.toLocaleString('en-IN')}</TableCell>}
                {columnVisibility.status && <TableCell>{asset.status}</TableCell>}
                 {columnVisibility.map && <TableCell>
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
                </TableCell>}
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem onSelect={() => openDialog(asset)}>
                         <Edit className="mr-2 h-4 w-4" />
                         Edit
                       </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(asset)} className="text-destructive">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 py-4">
                  <div className="md:col-span-3 grid md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="iid">Asset ID</Label>
                        <Input id="iid" name="iid" value={formData.iid || ''} onChange={handleFormChange} />
                    </div>
                    <div>
                        <Label htmlFor="name">Asset Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} />
                    </div>
                    <div>
                        <Label htmlFor="media">Media Type</Label>
                        <Select onValueChange={(value) => handleSelectChange('media', value)} value={formData.media}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                {mediaTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="md:col-span-3 border-t pt-4 mt-4 grid md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="state">State</Label>
                        <Select onValueChange={(value) => handleSelectChange('state', value)} value={formData.state}>
                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                            <SelectContent>
                                {statesAndDistricts.states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="district">District</Label>
                        <Select onValueChange={(value) => handleSelectChange('district', value)} value={formData.district} disabled={!formData.state}>
                            <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                            <SelectContent>
                                {statesAndDistricts.states.find(s => s.name === formData.state)?.districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="area">Area</Label>
                        <Input id="area" name="area" value={formData.area || ''} onChange={handleFormChange} />
                     </div>
                     <div className='md:col-span-2'>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" value={formData.location || ''} onChange={handleFormChange} required />
                    </div>
                     <div>
                        <Label htmlFor="direction">Direction</Label>
                        <Input id="direction" name="direction" value={formData.direction || ''} onChange={handleFormChange} />
                    </div>
                    <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" name="latitude" type="number" value={formData.latitude || ''} onChange={handleFormChange} />
                    </div>
                     <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" name="longitude" type="number" value={formData.longitude || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                 
                  <div className="md:col-span-3 border-t pt-4 mt-4 grid md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="dimensions">Dimension (e.g. 40x30 or 25x5-12x3)</Label>
                            <Input id="dimensions" name="dimensions" value={formData.dimensions || ''} onChange={handleFormChange} />
                        </div>
                        <div>
                            <Label htmlFor="width">Width (ft)</Label>
                            <Input id="width" name="width" type="number" value={formData.size?.width || ''} onChange={(e) => handleSizeChange(e, 1)} />
                        </div>
                        <div>
                            <Label htmlFor="height">Height (ft)</Label>
                            <Input id="height" name="height" type="number" value={formData.size?.height || ''} onChange={(e) => handleSizeChange(e, 1)} />
                        </div>
                       <div>
                            <Label htmlFor="totalSqft">Face 1 SQFT</Label>
                            <Input id="totalSqft" name="totalSqft" type="number" value={formData.totalSqft || ''} readOnly className="bg-muted" />
                        </div>

                        <div className="flex items-center space-x-2 pt-6">
                            <Switch id="multiface" checked={formData.multiface} onCheckedChange={(checked) => setFormData(prev => ({...prev, multiface: checked}))} />
                            <Label htmlFor="multiface">Multi-face</Label>
                        </div>

                        {formData.multiface && (
                             <>
                                <div>
                                    <Label htmlFor="width2">Face 2 Width (ft)</Label>
                                    <Input id="width2" name="width" type="number" value={formData.size2?.width || ''} onChange={(e) => handleSizeChange(e, 2)} />
                                </div>
                                <div>
                                    <Label htmlFor="height2">Face 2 Height (ft)</Label>
                                    <Input id="height2" name="height" type="number" value={formData.size2?.height || ''} onChange={(e) => handleSizeChange(e, 2)} />
                                </div>
                                <div>
                                    <Label htmlFor="totalSqft2">Face 2 SQFT</Label>
                                    <Input id="totalSqft2" name="totalSqft2" type="number" value={formData.totalSqft2 || ''} readOnly className="bg-muted" />
                                </div>
                             </>
                        )}
                        <div className="md:col-span-3">
                            <Label>Total Combined SQFT</Label>
                            <Input value={combinedSqft} readOnly className="bg-muted font-bold text-lg" />
                        </div>
                  </div>

                  <div className="md:col-span-3 border-t pt-4 mt-4 grid md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="status">Status</Label>
                         <Select onValueChange={(value) => handleSelectChange('status', value as AssetStatus)} value={formData.status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Available</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                       <div>
                        <Label htmlFor="ownership">Ownership</Label>
                         <Select onValueChange={(value) => handleSelectChange('ownership', value as AssetOwnership)} value={formData.ownership}>
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
                        <Label htmlFor="lightType">Light Type</Label>
                         <Select onValueChange={(value) => handleSelectChange('lightType', value as AssetLightType)} value={formData.lightType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select light type" />
                          </SelectTrigger>
                          <SelectContent>
                            {lightTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cardRate">Card Rate (per month)</Label>
                        <Input id="cardRate" name="cardRate" type="number" value={formData.cardRate || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="baseRate">Base Rate (per month)</Label>
                        <Input id="baseRate" name="baseRate" type="number" value={formData.baseRate || ''} onChange={handleFormChange} />
                      </div>
                  </div>

                  
                    <div className="md:col-span-3 border-t pt-4 mt-4">
                        <Card>
                            <CardHeader><Label htmlFor="images">Asset Images</Label></CardHeader>
                            <CardContent>
                                <div className='flex items-center gap-4'>
                                    <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isSaving}>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        {isSaving ? <Loader2 className="animate-spin" /> : 'Choose Images...'}
                                    </Button>
                                </div>

                                <Input ref={imageInputRef} id="images" type="file" multiple accept="image/*" onChange={handleImageFileChange} className="hidden" />
                                
                                <p className="text-xs text-muted-foreground mt-2">Previews of new images. They will be uploaded on save.</p>
                                <div className="mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {(formData.imageUrls || []).map(url => (
                                    <div key={url} className="relative h-24 w-24 group">
                                        <Image src={url} alt="Existing asset image" fill className="rounded-md object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={() => handleDeleteImage(url, false)}
                                            disabled={isSaving}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {newImageFiles.map((file, index) => (
                                     <div key={index} className="relative h-24 w-24 group">
                                        <Image src={URL.createObjectURL(file)} alt="New asset image preview" fill className="rounded-md object-cover" />
                                         <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={() => handleDeleteImage(URL.createObjectURL(file), true)}
                                            disabled={isSaving}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                  

                </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={closeDialog}>Close</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : 'Save Details'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <span><strong>Total SqFt:</strong> {getAssetTotalSqft(mapAsset)}</span>
                <span><strong>Light Type:</strong> {mapAsset?.lightType || 'N/A'}</span>
                <span><strong>Area:</strong> {mapAsset?.area || 'N/A'}</span>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
