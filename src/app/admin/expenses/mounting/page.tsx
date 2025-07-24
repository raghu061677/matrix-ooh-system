
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function MountingExpensesPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wrench />
                Mounting & Unmounting Expenses
            </CardTitle>
             <CardDescription>
                Keep a record of all costs related to mounting and unmounting jobs for your media assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section is for tracking labor costs, material expenses, and any other charges associated with the physical installation and removal of campaigns.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
