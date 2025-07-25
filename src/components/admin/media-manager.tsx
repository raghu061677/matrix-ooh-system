
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, arrayRemove, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, MoreHorizontal, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Asset, sampleAssets, AssetStatus } from './media-manager-types';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

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
        if (file.size > 2 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: `${file.name} is larger than 2MB. Please compress it.`,
            });
            continue; 
        }

        try {
            const imageRef = ref(storage, `media-assets/${assetId}/${file.name}_${Date.now()}`);
            const snapshot = await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            const assetDoc = doc(db, 'media_assets', assetId);
            // This is a simple way to handle image1 and image2. Could be improved.
            const currentAssetDoc = await getDocs(collection(db, 'media_assets'));
            const currentAssetData = currentAssetDoc.docs.find(d => d.id === assetId)?.data() as Asset;

            if (!currentAssetData.image1) {
              await updateDoc(assetDoc, { image1: downloadURL });
            } else if (!currentAssetData.image2) {
              await updateDoc(assetDoc, { image2: downloadURL });
            }
            uploadCount++;
        } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
        }
    }
    
    await getMediaAssets();
    const updatedAsset = mediaAssets.find(a => a.id === assetId);
    if(updatedAsset) setFormData(updatedAsset);
    
    setIsUploading(false);
    toast({
        title: 'Upload Complete!',
        description: `${uploadCount} of ${files.length} image(s) uploaded successfully.`,
    });
  };

  const handleDeleteImage = async (field: 'image1' | 'image2') => {
    const imageUrlToDelete = formData[field];
    if (!currentAsset?.id || !imageUrlToDelete) return;

    setIsUploading(true);
    toast({ title: 'Deleting image...', description: 'Please wait.' });

    try {
        const imageRef = ref(storage, imageUrlToDelete);
        await deleteObject(imageRef);

        const assetDoc = doc(db, 'media_assets', currentAsset.id);
        await updateDoc(assetDoc, { [field]: null });

        setFormData(prev => ({ ...prev, [field]: undefined }));
        
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
        const docRef = await addDoc(mediaAssetsCollectionRef, { ...dataToSave, createdAt: serverTimestamp() });
        const newAsset = { ...dataToSave, id: docRef.id } as Asset;
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
    setFormData(asset || { status: 'Available' });
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
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredAssets.map(asset => (
              <TableRow key={asset.id}>
                 <TableCell>
                  {asset.image1 ? (
                    <Image
                      src={asset.image1}
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
                <TableCell>{asset.rate?.toLocaleString('en-IN')}</TableCell>

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
        <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentAsset?.id ? 'Edit Media Asset' : 'Add New Media Asset'}</DialogTitle>
            <DialogDescription>
              {currentAsset?.id ? 'Update the details for this media asset.' : 'Fill in the details for the new media asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location || ''} onChange={handleFormChange} required />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                     <Select onValueChange={(value) => handleSelectChange('status', value as AssetStatus)} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Booked">Booked</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rate">Rate (per month)</Label>
                    <Input id="rate" name="rate" type="number" value={formData.rate || ''} onChange={handleFormChange} />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="images">Asset Images (Max 2)</Label>
                    <Input ref={imageInputRef} id="images" type="file" multiple onChange={handleImageFileChange} disabled={!currentAsset?.id || isUploading || (!!formData.image1 && !!formData.image2) }/>
                    {isUploading && <Loader2 className="animate-spin mt-2" />}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.image1 && (
                        <div className="relative h-20 w-20 group">
                          <Image src={formData.image1} alt="Asset image 1" layout="fill" className="rounded-md object-cover" />
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage('image1')}
                              disabled={isUploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                      )}
                       {formData.image2 && (
                        <div className="relative h-20 w-20 group">
                          <Image src={formData.image2} alt="Asset image 2" layout="fill" className="rounded-md object-cover" />
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage('image2')}
                              disabled={isUploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                      )}
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
