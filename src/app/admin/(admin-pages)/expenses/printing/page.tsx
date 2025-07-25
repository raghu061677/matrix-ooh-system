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
                This section displays costs associated with printing jobs. The expense data is pulled from the "Media Plans" or "Operations" sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                To log a printing expense, please go to the relevant Media Plan or Operation Task and add the cost details there. This ensures that financial data and campaign activities are always in sync.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
