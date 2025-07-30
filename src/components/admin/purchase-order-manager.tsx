
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Loader2, Search, FileText, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { PurchaseOrder } from '@/types/sales';

export function PurchaseOrderManager() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const generatedPOsQuery = query(collectionGroup(db, 'entries'));
        const snapshot = await getDocs(generatedPOsQuery);

        const pos = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
          .filter(po => po.companyId === user.companyId); // This client-side filter is suboptimal but necessary for collectionGroup

        setPurchaseOrders(pos);
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        toast({
          variant: 'destructive',
          title: 'Failed to fetch purchase orders',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po =>
      Object.values(po).some(val =>
        String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [purchaseOrders, filter]);

  const pendingPOs = filteredPOs.filter(po => po.poStatus === 'generated');
  const approvedPOs = filteredPOs.filter(po => po.poStatus === 'approved');

  const renderTable = (data: PurchaseOrder[]) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No purchase orders in this category.
              </TableCell>
            </TableRow>
          )}
          {data.map(po => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">{po.poNumber || 'N/A'}</TableCell>
              <TableCell>{po.customerId}</TableCell>
              <TableCell>₹{po.poAmount?.toLocaleString('en-IN')}</TableCell>
              <TableCell>{po.createdAt ? format(new Date((po.createdAt as any).seconds * 1000), 'dd MMM yyyy') : 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={po.poStatus === 'approved' ? 'default' : 'secondary'} className="capitalize">
                  {po.poStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {po.poStatus === 'generated' && (
                  <>
                    <Button variant="ghost" size="icon" className="text-green-600"><Check /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600"><X /></Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText />
            Purchase Orders
        </h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter all POs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon"><Search /></Button>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingPOs.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedPOs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {renderTable(pendingPOs)}
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          {renderTable(approvedPOs)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
