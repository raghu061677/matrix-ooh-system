
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
import { Loader2, Search, FilePieChart, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Invoice, CreditNote } from '@/types/sales';

export function SalesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const invoicesQuery = query(collectionGroup(db, 'entries'), where('companyId', '==', user.companyId));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        setInvoices(invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));

        const creditNotesQuery = query(collection(db, 'creditNotes'), where('companyId', '==', user.companyId));
        const creditNotesSnapshot = await getDocs(creditNotesQuery);
        setCreditNotes(creditNotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditNote)));

      } catch (error) {
        console.error("Error fetching sales data:", error);
        toast({
          variant: 'destructive',
          title: 'Failed to fetch sales documents',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      Object.values(invoice).some(val =>
        String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [invoices, filter]);

  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter(cn =>
        cn.reason.toLowerCase().includes(filter.toLowerCase()) ||
        cn.customerId.toLowerCase().includes(filter.toLowerCase())
    );
  }, [creditNotes, filter]);
  
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending');
  const approvedInvoices = filteredInvoices.filter(inv => inv.status === 'approved');

  const renderInvoiceTable = (data: Invoice[]) => (
     <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount (with Tax)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 && (
            <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invoices in this category.
                </TableCell>
            </TableRow>
          )}
          {data.map(invoice => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber || 'N/A'}</TableCell>
              <TableCell>{invoice.customerId}</TableCell>
              <TableCell>{invoice.invoiceDate ? format(new Date((invoice.invoiceDate as any).seconds * 1000), 'dd MMM yyyy') : 'N/A'}</TableCell>
              <TableCell>₹{invoice.invoiceAmountWithTax.toLocaleString('en-IN')}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                    {invoice.status}
                </Badge>
              </TableCell>
               <TableCell className="text-right">
                 {invoice.status === 'pending' && (
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
  
  const renderCreditNoteTable = (data: CreditNote[]) => (
     <div className="border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Original Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No credit notes found.
                        </TableCell>
                    </TableRow>
                )}
                {data.map(cn => (
                    <TableRow key={cn.id}>
                        <TableCell>{cn.dateIssued ? format(new Date((cn.dateIssued as any).seconds * 1000), 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell>{cn.customerId}</TableCell>
                        <TableCell>{cn.reason}</TableCell>
                        <TableCell>{cn.invoiceId}</TableCell>
                        <TableCell>₹{cn.amount.toLocaleString('en-IN')}</TableCell>
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
                <FilePieChart />
                Sales Estimates
            </h1>
             <div className="flex items-center gap-2">
                <Input 
                    placeholder="Filter documents..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-64"
                />
                 <Button variant="outline" size="icon"><Search /></Button>
            </div>
        </div>

        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending Invoices ({pendingInvoices.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved Invoices ({approvedInvoices.length})</TabsTrigger>
                <TabsTrigger value="credit-notes">Credit Notes ({filteredCreditNotes.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
                {renderInvoiceTable(pendingInvoices)}
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
                 {renderInvoiceTable(approvedInvoices)}
            </TabsContent>
             <TabsContent value="credit-notes" className="mt-4">
                {renderCreditNoteTable(filteredCreditNotes)}
            </TabsContent>
        </Tabs>
    </div>
  );
}
