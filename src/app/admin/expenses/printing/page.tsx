
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';

export default function PrintingExpensesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Printer />
                Printing Expenses
            </CardTitle>
             <CardDescription>
                Track all costs associated with printing flex and other campaign materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will contain a detailed log of all printing expenses, including vendor details, costs per square foot, and associated campaigns.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
