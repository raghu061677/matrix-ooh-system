import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function MountingTasksPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wrench />
                Mounting Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will manage all mounting and unmounting jobs. You can track tasks from creative receipt to final installation photos.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
