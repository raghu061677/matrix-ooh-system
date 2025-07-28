
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Asset } from './media-manager-types'; 
import { Loader2, Search, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SelectAssetsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToPlan: (selectedAssets: Asset[]) => void;
}

export function SelectAssetsDialog({
  isOpen,
  onOpenChange,
  onAddToPlan,
}: SelectAssetsDialogProps) {
  const [loading, setLoading] = React.useState(true);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = React.useState<Asset[]>([]);
  const [filter, setFilter] = React.useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && user?.companyId) {
      const fetchAssets = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, 'mediaAssets'), where('companyId', '==', user.companyId));
          const querySnapshot = await getDocs(q);
          const fetchedAssets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
          setAssets(fetchedAssets);
        } catch (error) {
          console.error("Error fetching assets: ", error);
          toast({ variant: 'destructive', title: 'Error fetching assets.'});
        } finally {
          setLoading(false);
        }
      }
      fetchAssets();
      setSelectedAssets([]); // Reset selection when dialog opens
    }
  }, [isOpen, user, toast]);

  const handleSelect = (asset: Asset, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAssets((prev) => [...prev, asset]);
    } else {
      setSelectedAssets((prev) => prev.filter((a) => a.id !== asset.id));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedAssets(filteredAssets);
    } else {
      setSelectedAssets([]);
    }
  };

  const filteredAssets = React.useMemo(() => {
    return assets.filter((asset) =>
      Object.values(asset).some((val) =>
        String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [assets, filter]);

  const handleSubmit = () => {
    onAddToPlan(selectedAssets);
  };
  
  const isAllSelected = filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length;
  const isSomeSelected = selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media Assets</DialogTitle>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search by any field..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 w-full"
            />
        </div>
        <ScrollArea className="flex-grow border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} data-state={selectedAssets.some(a => a.id === asset.id) && 'selected'}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAssets.some(a => a.id === asset.id)}
                        onCheckedChange={(checked) => handleSelect(asset, Boolean(checked))}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>
                      {asset.imageUrls && asset.imageUrls.length > 0 ? (
                        <Image
                          src={asset.imageUrls[0]}
                          alt={asset.location || 'Asset image'}
                          width={48}
                          height={48}
                          className="rounded-md object-cover h-12 w-12"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{asset.media}</TableCell>
                    <TableCell>{asset.rate?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{asset.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        <DialogFooter>
          <p className="mr-auto text-sm text-muted-foreground">
            {selectedAssets.length} of {assets.length} assets selected.
          </p>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={selectedAssets.length === 0}>
            Add to Plan ({selectedAssets.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
