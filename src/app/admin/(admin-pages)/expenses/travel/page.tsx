import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel } from 'lucide-react';

export default function TravelExpensesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Fuel />
                Travel Expenses
            </CardTitle>
             <CardDescription>
                Log all travel-related costs, such as petrol bills, for your operational teams.
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
