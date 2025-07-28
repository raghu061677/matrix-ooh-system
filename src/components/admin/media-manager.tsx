
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
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
import { Asset, sampleAssets, AssetStatus, AssetOwnership, mediaTypes } from './media-manager-types';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '../ui/switch';
import { statesAndDistricts } from '@/lib/india-states';
import { Card, CardContent, CardHeader } from '../ui/card';
import ExifParser from 'exif-parser';

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
             setMediaAssets(sampleAssets.filter(asset => asset.companyId === user?.companyId));
        }
    } catch(e) {
         console.error("Error fetching media assets:", e);
         toast({
            variant: 'destructive',
            title: 'Error fetching assets',
            description: 'Could not retrieve asset data. Using sample data.'
        });
        setMediaAssets(sampleAssets.filter(asset => asset.companyId === user?.companyId));
    }
    setLoading(false);
  };

  useEffect(() => {
    if(user) {
      getMediaAssets();
    }
  }, [user]);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || undefined : value }));
  };
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>, face: 1 | 2) => {
    const { name, value } = e.target;
    const sizeKey = face === 1 ? 'size' : 'size2';
    const sqftKey = face === 1 ? 'totalSqft' : 'totalSqft2';

    const newSize = { ...formData[sizeKey], [name]: parseFloat(value) || 0 };
    const totalSqft = (newSize.width || 0) * (newSize.height || 0);

    setFormData(prev => ({ 
        ...prev, 
        [sizeKey]: newSize,
        [sqftKey]: totalSqft > 0 ? totalSqft : undefined
    }));
  };

  const handleSelectChange = (name: keyof Asset, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (name === 'state') {
        setFormData(prev => ({...prev, district: undefined})); // Reset district on state change
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const assetId = currentAsset?.id;
    if (!files || files.length === 0 || !assetId) return;

    setIsUploading(true);
    toast({ title: `Uploading ${files.length} image(s)...` });

    let currentImageUrls = formData.imageUrls || [];

    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `${file.name} is over 2MB. Please compress it.`,
        });
        continue;
      }

      // Check for GPS data in EXIF
      const arrayBuffer = await file.arrayBuffer();
      try {
        const parser = ExifParser.create(arrayBuffer);
        const result = parser.parse();
        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
           setFormData(prev => ({
              ...prev,
              latitude: result.tags.GPSLatitude,
              longitude: result.tags.GPSLongitude,
           }));
           toast({ title: 'Geotag Found!', description: `Latitude & Longitude updated from ${file.name}.` });
        }
      } catch (exifError) {
        console.warn('Could not parse EXIF data from image.', exifError);
      }
      
      try {
        const imageRef = ref(storage, `media-assets/${assetId}/${file.name}_${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        currentImageUrls.push(downloadURL);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
      }
    }
    
    setFormData(prev => ({ ...prev, imageUrls: [...currentImageUrls] }));
    
    // Batch update Firestore once
    const assetDoc = doc(db, 'mediaAssets', assetId);
    await updateDoc(assetDoc, { imageUrls: currentImageUrls });
    
    await getMediaAssets();
    setIsUploading(false);
    toast({
        title: 'Upload Complete!',
        description: `Images uploaded successfully.`,
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
        setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!user?.companyId) return;
    setIsSaving(true);
    
    const dataToSave: Partial<Asset> = {
      ...Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined)),
      companyId: user.companyId,
      updatedAt: new Date()
    };

    if (!dataToSave.multiface) {
        dataToSave.size2 = undefined;
        dataToSave.totalSqft2 = undefined;
    }

    try {
      if (currentAsset?.id) {
        const assetDoc = doc(db, 'mediaAssets', currentAsset.id);
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
    setFormData(asset || { status: 'active', ownership: 'own', companyId: user?.companyId, multiface: false });
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
     if(!confirm(`Are you sure you want to delete asset ${asset.name} (${asset.location})?`)) return;
     const assetDoc = doc(db, 'mediaAssets', asset.id);
     await deleteDoc(assetDoc);
     await getMediaAssets();
     toast({ title: 'Asset Deleted', description: `${asset.name} has been removed.` });
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
    return sortableAssets;
  }, [mediaAssets, filter]);

  const combinedSqft = useMemo(() => {
    const sqft1 = formData.totalSqft || 0;
    const sqft2 = formData.multiface ? (formData.totalSqft2 || 0) : 0;
    return sqft1 + sqft2;
  }, [formData.totalSqft, formData.totalSqft2, formData.multiface]);

  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
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
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SQFT</TableHead>
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
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>{(asset.totalSqft || 0) + (asset.multiface ? (asset.totalSqft2 || 0) : 0)}</TableCell>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 py-4">
                  <div className="md:col-span-3 grid md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="iid">Asset ID</Label>
                        <Input id="iid" name="iid" value={formData.iid || ''} onChange={handleFormChange} />
                    </div>
                     <div>
                        <Label htmlFor="name">Location Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} required />
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
                        <Label htmlFor="location">Location Description</Label>
                        <Input id="location" name="location" value={formData.location || ''} onChange={handleFormChange} />
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
                        <Label htmlFor="cardRate">Card Rate (per month)</Label>
                        <Input id="cardRate" name="cardRate" type="number" value={formData.cardRate || ''} onChange={handleFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="baseRate">Base Rate (per month)</Label>
                        <Input id="baseRate" name="baseRate" type="number" value={formData.baseRate || ''} onChange={handleFormChange} />
                      </div>
                  </div>

                  {currentAsset?.id && (
                    <div className="md:col-span-3 border-t pt-4 mt-4">
                        <Card>
                            <CardHeader><Label htmlFor="images">Asset Images</Label></CardHeader>
                            <CardContent>
                                <div className='flex items-center gap-4'>
                                    <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        {isUploading ? <Loader2 className="animate-spin" /> : 'Upload Images'}
                                    </Button>
                                </div>

                                <Input ref={imageInputRef} id="images" type="file" multiple accept="image/*" onChange={handleImageFileChange} className="hidden" />

                                <div className="mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {(formData.imageUrls || []).map(url => (
                                    <div key={url} className="relative h-24 w-24 group">
                                    <Image src={url} alt="Asset image" fill className="rounded-md object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => handleDeleteImage(url)}
                                        disabled={isUploading}
                                        >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                  )}

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
    </>
  );
}
