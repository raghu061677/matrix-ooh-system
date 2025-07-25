
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePieChart } from 'lucide-react';

export default function SalesEstimatesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FilePieChart />
                Sales Estimates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will contain management for all sales estimate documents, including pending invoices, proforma invoices, approved invoices, credit notes, and more.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
