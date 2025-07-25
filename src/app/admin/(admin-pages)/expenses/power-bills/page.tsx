
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function PowerBillsPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Zap />
                Power Bills
            </CardTitle>
            <CardDescription>
                Manage all electricity expenses for your back-lit media assets. You can add new bills, track payments, and view due dates. This section will eventually sync with Zoho Expense.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                The table below will list all power bills. You will be able to filter and search for specific bills.
            </p>
            <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold mb-2">Future Table Columns:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-2">
                    <li>Asset Area</li>
                    <li>Asset Location</li>
                    <li>Name on Connection</li>
                    <li>Meter No</li>
                    <li>Service No</li>
                    <li>Arrears</li>
                    <li>Due Payments</li>
                    <li>Total Due</li>
                    <li>Units</li>
                    <li>Bill Date</li>
                    <li>Due Date</li>
                    <li>Paid Amount</li>
                    <li>Paid Date</li>
                    <li>Status</li>
                    <li>Actions</li>
                </ul>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
