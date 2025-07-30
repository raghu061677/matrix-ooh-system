
'use client';

import React from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, List, FileText, BarChart2, Presentation } from 'lucide-react';

interface ExportDownloadLinksProps {
    planId: string;
}

export function ExportDownloadLinks({ planId }: ExportDownloadLinksProps) {
  const [urls, setUrls] = React.useState({ pdfUrl: '', excelUrl: '', pptUrl: '' });
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!planId) return;
    setLoading(true);
    
    const unsub = onSnapshot(doc(db, "plans", planId), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setUrls(data.exports || { pdfUrl: '', excelUrl: '', pptUrl: '' });
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching export links:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch previously exported file links.',
        });
        setLoading(false);
    });

    return () => unsub();
  }, [planId, toast]);

  if (loading) {
    return (
        <Card>
            <CardHeader><CardTitle className='text-base'>Previously Exported</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  const hasLinks = urls.pdfUrl || urls.excelUrl || urls.pptUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
            <List />
            Previously Exported Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasLinks ? (
             <ul className="space-y-2">
                {urls.pdfUrl && <li><Button asChild variant="link" className="p-0 h-auto gap-2"><a href={urls.pdfUrl} target="_blank" rel="noopener noreferrer"><FileText />View PDF (Work Order)</a></Button></li>}
                {urls.excelUrl && <li><Button asChild variant="link" className="p-0 h-auto gap-2"><a href={urls.excelUrl} target="_blank" rel="noopener noreferrer"><BarChart2 />View Excel Plan</a></Button></li>}
                {urls.pptUrl && <li><Button asChild variant="link" className="p-0 h-auto gap-2"><a href={urls.pptUrl} target="_blank" rel="noopener noreferrer"><Presentation />View PPT Deck</a></Button></li>}
            </ul>
        ) : (
            <p className="text-sm text-muted-foreground">No files have been exported for this plan yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
