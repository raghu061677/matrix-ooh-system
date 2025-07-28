
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

export default function AutoAvailsPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Send />
                Automatic Site Availability
            </CardTitle>
             <CardDescription>
                Set up and manage automated daily availability reports for your clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will allow you to create and manage automated availability sends. You can select clients, verify points of contact, and let the system handle the daily routine of sending avails, freeing up your team to focus on closing deals.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
