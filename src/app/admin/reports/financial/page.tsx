
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from 'lucide-react';

export default function FinancialReportPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AreaChart />
                Financial Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will provide comprehensive financial reports, including revenue, expenses, and profitability. You will be able to generate reports by date range, client, and campaign.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
