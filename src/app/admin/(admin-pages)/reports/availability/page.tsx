
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePieChart } from 'lucide-react';

export default function AvailabilityReportPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FilePieChart />
                Availability Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will provide a detailed report on the availability of all media assets. You will be able to filter by location, type, and status to get a clear overview of your inventory.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
