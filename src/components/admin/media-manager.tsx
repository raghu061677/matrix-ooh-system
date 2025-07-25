
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, MoreHorizontal, X, Upload } from 'lucide-react';
import { Asset, sampleAssets, AssetStatus } from './media-manager-types';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { statesAndDistricts } from '@/lib/india-states';
import ExifParser from 'exif-parser';

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
  const [isUploading, setIsUploading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const { toast } = useToast();
  const mediaAssetsCollectionRef = collection(db, 'media_assets');

  const getMediaAssets = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
        const data = await getDocs(mediaAssetsCollectionRef);
        const companyAssets = data.docs
            .map((doc) => ({ ...doc.data(), id: doc.id } as Asset))
            .filter(asset => asset.companyId === user.companyId);

        if (companyAssets.length > 0) {
            setMediaAssets(companyAssets);
        } else {
             setMediaAssets(sampleAssets.filter(asset => asset.companyId === user.companyId));
        }
    } catch(e) {
         console.error("Error fetching media assets:", e);
         toast({
            variant: 'destructive',
            title: 'Error fetching assets',
            description: 'Could not retrieve asset data. Using sample data.'
        });
        setMediaAssets(sampleAssets.filter(asset => asset.companyId === user.companyId));
    }
    setLoading(false);
  };

  useEffect(() => {
    getMediaAssets();
  }, [user]);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || undefined : value }));
  };

  const handleSelectChange = (name: keyof Asset, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentAsset?.id) return;

    setIsUploading(true);
    toast({ title: `Uploading ${files.length} image(s)...` });

    const assetId = currentAsset.id;
    let uploadCount = 0;

    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `${file.name} is over 2MB. Please compress it.`,
        });
        continue;
      }
      
      try {
        // EXIF data extraction
        const arrayBuffer = await file.arrayBuffer();
        try {
            const parser = ExifParser.create(arrayBuffer);
            const result = parser.parse();
            if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
                setFormData(prev => ({
                    ...prev,
                    latitude: result.tags.GPSLatitude,
                    longitude: result.tags.GPSLongitude
                }));
                toast({ title: 'GPS Data Found!', description: `Coordinates extracted from ${file.name}` });
            }
        } catch (exifError) {
            // Non-fatal, just log it.
            console.warn(`Could not parse EXIF data for ${file.name}`, exifError);
        }
        
        const imageRef = ref(storage, `media-assets/${assetId}/${file.name}_${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const assetDoc = doc(db, 'media_assets', assetId);
        await updateDoc(assetDoc, {
          imageUrls: (formData.imageUrls || []).concat(downloadURL)
        });
        setFormData(prev => ({...prev, imageUrls: [...(prev.imageUrls || []), downloadURL]}));

        uploadCount++;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
      }
    }
    
    await getMediaAssets();
    setIsUploading(false);
    toast({
        title: 'Upload Complete!',
        description: `${uploadCount} of ${files.length} image(s) uploaded successfully.`,
    });
    // Clear file input
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };


  const handleDeleteImage = async (imageUrlToDelete: string) => {
    if (!currentAsset?.id || !imageUrlToDelete) return;

    setIsUploading(true);
    toast({ title: 'Deleting image...', description: 'Please wait.' });

    try {
        const imageRef = ref(storage, imageUrlToDelete);
        await deleteObject(imageRef);

        const assetDoc = doc(db, 'media_assets', currentAsset.id);
        await updateDoc(assetDoc, { imageUrls: (formData.imageUrls || []).filter(url => url !== imageUrlToDelete) });

        setFormData(prev => ({ ...prev, imageUrls: (prev.imageUrls || []).filter(url => url !== imageUrlToDelete) }));
        
        await getMediaAssets();
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
    if(!user?.companyId) return;
    setIsSaving(true);
    
    const dataToSave = {
      ...Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined)),
      companyId: user.companyId
    };

    try {
      if (currentAsset?.id) {
        const assetDoc = doc(db, 'media_assets', currentAsset.id);
        await updateDoc(assetDoc, dataToSave);
        toast({ title: 'Asset Updated!', description: 'The media asset details have been saved.' });
      } else {
        const docRef = await addDoc(mediaAssetsCollectionRef, { ...dataToSave, createdAt: serverTimestamp(), imageUrls: [] });
        const newAsset = { ...dataToSave, id: docRef.id, imageUrls: [] } as Asset;
        setCurrentAsset(newAsset);
        setFormData(newAsset);
        toast({ title: 'Asset Added!', description: 'You can now upload images to this asset.' });
      }
      
      await getMediaAssets();
      if (!currentAsset?.id) closeDialog(); // Close only when creating a new one
    } catch (error) {
        console.error("Error saving asset: ", error);
        toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save asset details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openDialog = (asset: Asset | null = null) => {
    setCurrentAsset(asset);
    setFormData(asset || { status: 'active', companyId: user?.companyId });
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
     if(!confirm(`Are you sure you want to delete asset ${asset.area} (${asset.location})?`)) return;
     const assetDoc = doc(db, 'media_assets', asset.id);
     await deleteDoc(assetDoc);
     await getMediaAssets();
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
              <TableHead>Image</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Card Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredAssets.map(asset => (
              <TableRow key={asset.id}>
                 <TableCell>
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
                </TableCell>
                <TableCell className="font-medium">{asset.location}</TableCell>
                <TableCell>{asset.city}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>{asset.cardRate?.toLocaleString('en-IN')}</TableCell>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location || ''} onChange={handleFormChange} required />
                  </div>
                  <div>
                    <Label htmlFor="area">Area/Landmark</Label>
                    <Input id="area" name="area" value={formData.area || ''} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="direction">Direction Facing</Label>
                    <Input id="direction" name="direction" value={formData.direction || ''} onChange={handleFormChange} />
                  </div>
                   <div>
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={(value) => handleSelectChange('state', value)} value={formData.state}>
                        <SelectTrigger><SelectValue placeholder="Select state..."/></SelectTrigger>
                        <SelectContent>
                            {statesAndDistricts.states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Select onValueChange={(value) => handleSelectChange('city', value)} value={formData.city}>
                        <SelectTrigger><SelectValue placeholder="Select city..."/></SelectTrigger>
                        <SelectContent>
                            {statesAndDistricts.states.find(s => s.name === formData.state)?.districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="width1">Width (ft)</Label>
                        <Input id="width1" name="width1" type="number" value={formData.width1 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="height1">Height (ft)</Label>
                        <Input id="height1" name="height1" type="number" value={formData.height1 || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="sqft">Total Sqft</Label>
                        <Input id="sqft" name="sqft" type="number" value={formData.sqft || (formData.width1 || 0) * (formData.height1 || 0)} onChange={handleFormChange} />
                      </div>
                      <div>
                         <Label htmlFor="units">Units</Label>
                         <Input id="units" name="units" type="number" value={formData.units || 1} onChange={handleFormChange} />
                      </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                     <Select onValueChange={(value) => handleSelectChange('status', value as AssetStatus)} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                         <SelectItem value="deleted">Deleted</SelectItem>
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

                   <div>
                    <Label htmlFor="media">Media Type</Label>
                    <Input id="media" name="media" value={formData.media || 'Hoarding'} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="light">Lighting</Label>
                    <Input id="light" name="light" value={formData.light || 'Frontlit'} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="supplierId">Supplier</Label>
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
                  

                  <div className="md:col-span-2">
                    <Label htmlFor="images">Asset Images</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={!currentAsset?.id || isUploading}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload Images
                    </Button>
                    <Input ref={imageInputRef} id="images" type="file" multiple accept="image/*" onChange={handleImageFileChange} className="hidden" />

                    {isUploading && <Loader2 className="animate-spin mt-2" />}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(formData.imageUrls || []).map(url => (
                        <div key={url} className="relative h-24 w-24 group">
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
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={closeDialog}>Close</Button>
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
