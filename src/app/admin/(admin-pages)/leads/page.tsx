
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import { Enquiry } from '@/types/firestore';

export default function AdminLeadsPage() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;

    // NOTE: For a multi-tenant app, you'd filter by companyId.
    // However, enquiries are public. We show all for the admin.
    // Add companyId to enquiry docs if you need to segregate them.
    const q = query(collection(db, "mediaEnquiries"), orderBy("submittedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enquiry));
      setEnquiries(results);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching enquiries:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <MessageSquare />
            Media Enquiries
        </CardTitle>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Message</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {enquiries.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No enquiries yet.
                        </TableCell>
                    </TableRow>
                )}
                {enquiries.map(enquiry => (
                    <TableRow key={enquiry.id}>
                        <TableCell>
                            {enquiry.submittedAt ? format(new Date((enquiry.submittedAt as any).seconds * 1000), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{enquiry.name}</div>
                            <div className="text-sm text-muted-foreground">{enquiry.email}</div>
                            <div className="text-sm text-muted-foreground">{enquiry.phone}</div>
                        </TableCell>
                        <TableCell>
                            <div>{enquiry.assetId}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                            <span title={enquiry.message}>{enquiry.message}</span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
         </Table>
      </CardContent>
    </Card>
  );
}
