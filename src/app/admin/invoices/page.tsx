
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptText } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ReceiptText />
                Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will contain management for all invoice documents, including pending, approved, and rejected invoices.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
