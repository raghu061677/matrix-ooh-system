import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function FlexStockPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Package />
                Flex Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will manage your inventory of physical flex media, including stock levels, received items, and their current status.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
