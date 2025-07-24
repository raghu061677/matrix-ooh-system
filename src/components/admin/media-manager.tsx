
'use client';

import { useState } from 'react';
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { mediaLocations as initialMediaLocations } from '@/components/home/portfolio';

export function MediaManager() {
  const [mediaAssets, setMediaAssets] = useState(initialMediaLocations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const { toast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assetData = Object.fromEntries(formData.entries());
    
    if (currentAsset) {
      // Edit existing asset
      setMediaAssets(mediaAssets.map(asset => asset.id === currentAsset.id ? { ...asset, ...assetData, id: currentAsset.id } : asset));
      toast({ title: 'Asset Updated!', description: 'The media asset has been successfully updated.' });
    } else {
      // Add new asset
      assetData.id = mediaAssets.length > 0 ? Math.max(...mediaAssets.map(a => a.id)) + 1 : 1;
      setMediaAssets([...mediaAssets, assetData]);
      toast({ title: 'Asset Added!', description: 'The new media asset has been added.' });
    }

    closeDialog();
  };

  const openDialog = (asset = null) => {
    setCurrentAsset(asset);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentAsset(null);
  };
  
  const handleDelete = (asset) => {
     setMediaAssets(mediaAssets.filter(a => a.id !== asset.id));
     toast({ title: 'Asset Deleted', description: `${asset.title} has been removed.` });
  };

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
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaAssets.map(asset => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.title}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>{asset.category}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAsset ? 'Edit Media Asset' : 'Add New Media Asset'}</DialogTitle>
            <DialogDescription>
              {currentAsset ? 'Update the details for this media asset.' : 'Fill in the details for the new media asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" defaultValue={currentAsset?.title} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" name="location" defaultValue={currentAsset?.location} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input id="category" name="category" defaultValue={currentAsset?.category} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" name="description" defaultValue={currentAsset?.description} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" defaultValue={currentAsset?.imageUrl} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
