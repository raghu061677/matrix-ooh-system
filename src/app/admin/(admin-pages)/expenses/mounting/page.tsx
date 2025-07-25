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
                This section displays costs associated with mounting and unmounting jobs. The expense data is pulled directly from the tasks managed in the "Operations / Mounting Tasks" section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                To log a mounting expense, please go to the "Mounting Tasks" page and add the cost details to the relevant task. This ensures that operational activities and their financial impact are always in sync.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
