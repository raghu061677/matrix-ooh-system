
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

export default function OfficeExpensesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Building />
                Office Expenses
            </CardTitle>
             <CardDescription>
                Manage general office expenses, including rent, utilities, and supplies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section is for tracking all administrative and office-related overhead costs to provide a complete financial overview.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
