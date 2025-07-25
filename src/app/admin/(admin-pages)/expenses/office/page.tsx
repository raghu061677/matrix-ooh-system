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
                This area will allow you to manage fuel expenses, vehicle maintenance, and other travel costs incurred during site visits, client meetings, and mounting tasks.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
