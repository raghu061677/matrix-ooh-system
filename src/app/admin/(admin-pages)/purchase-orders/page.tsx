import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function PurchaseOrdersPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText />
                Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will contain management for all purchase order documents, including pending, approved, and generated POs.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
