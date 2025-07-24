
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

export function MediaManager() {
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<any>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const mediaAssetsCollectionRef = collection(db, 'media_assets');

  useEffect(() => {
    const getMediaAssets = async () => {
      setLoading(true);
      const data = await getDocs(mediaAssetsCollectionRef);
      setMediaAssets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    };

    getMediaAssets();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const assetData: any = Object.fromEntries(formData.entries());
    if (status) {
      assetData.status = status;
    }
    
    setLoading(true);
    if (currentAsset) {
      // Edit existing asset
      const assetDoc = doc(db, 'media_assets', currentAsset.id);
      await updateDoc(assetDoc, assetData);
      setMediaAssets(mediaAssets.map(asset => asset.id === currentAsset.id ? { ...asset, ...assetData, id: currentAsset.id } : asset));
      toast({ title: 'Asset Updated!', description: 'The media asset has been successfully updated.' });
    } else {
      // Add new asset
      const docRef = await addDoc(mediaAssetsCollectionRef, assetData);
      setMediaAssets([...mediaAssets, { ...assetData, id: docRef.id }]);
      toast({ title: 'Asset Added!', description: 'The new media asset has been added.' });
    }
    setLoading(false);
    closeDialog();
  };

  const openDialog = (asset: any = null) => {
    setCurrentAsset(asset);
    setStatus(asset?.status);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentAsset(null);
    setStatus(undefined);
  };
  
  const handleDelete = async (asset: any) => {
     const assetDoc = doc(db, 'media_assets', asset.id);
     await deleteDoc(assetDoc);
     setMediaAssets(mediaAssets.filter(a => a.id !== asset.id));
     toast({ title: 'Asset Deleted', description: `${asset.location} has been removed.` });
  };
  
  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Media Asset Manager</h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2" />
          Add New Asset
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Card Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaAssets.map(asset => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.location}</TableCell>
                <TableCell>{asset.district}</TableCell>
                <TableCell>{asset.area}</TableCell>
                <TableCell>{asset.dimensions}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>{asset.cardRate}</TableCell>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentAsset ? 'Edit Media Asset' : 'Add New Media Asset'}</DialogTitle>
            <DialogDescription>
              {currentAsset ? 'Update the details for this media asset.' : 'Fill in the details for the new media asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={currentAsset?.location} required />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input id="district" name="district" defaultValue={currentAsset?.district} />
              </div>
               <div>
                <Label htmlFor="area">Area</Label>
                <Input id="area" name="area" defaultValue={currentAsset?.area} />
              </div>
              <div>
                <Label htmlFor="trafficDirection">Traffic Direction</Label>
                <Input id="trafficDirection" name="trafficDirection" defaultValue={currentAsset?.trafficDirection} />
              </div>
               <div>
                <Label htmlFor="dimensions">Dimensions (e.g. 14' x 48')</Label>
                <Input id="dimensions" name="dimensions" defaultValue={currentAsset?.dimensions} />
              </div>
              <div>
                <Label htmlFor="totalSqft">Total Sqft</Label>
                <Input id="totalSqft" name="totalSqft" type="number" defaultValue={currentAsset?.totalSqft} />
              </div>
              <div>
                <Label htmlFor="lighting">Lighting</Label>
                <Input id="lighting" name="lighting" defaultValue={currentAsset?.lighting} />
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price</Label>
                <Input id="basePrice" name="basePrice" type="number" step="0.01" defaultValue={currentAsset?.basePrice} />
              </div>
              <div>
                <Label htmlFor="cardRate">Card Rate</Label>
                <Input id="cardRate" name="cardRate" type="number" step="0.01" defaultValue={currentAsset?.cardRate} />
              </div>
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" name="latitude" type="number" step="any" defaultValue={currentAsset?.latitude} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" name="longitude" type="number" step="any" defaultValue={currentAsset?.longitude} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                 <Select onValueChange={setStatus} defaultValue={currentAsset?.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" defaultValue={currentAsset?.imageUrl} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
