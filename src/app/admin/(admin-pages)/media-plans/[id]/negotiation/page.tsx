

'use client';

import * as React from 'react';
import { PlanNegotiation } from '@/components/admin/plan-negotiation';
import { MediaPlan } from '@/types/media-plan';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Customer, User } from '@/types/firestore';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';
import { useParams } from 'next/navigation';


// Mock data fetching - In a real app, this would be more robust
const sampleData: MediaPlan[] = [
    { id: '1', projectId: 'P00109', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-1', customerName: 'Matrix Network Solutions', displayName: 'CRI', startDate: new Date('2025-07-26'), endDate: new Date('2025-08-24'), days: 30, 
        statistics: { haMarkupPercentage: 10.14, taMarkupPercentage: 0, roiPercentage: 0, occupancyPercentage: 0, haMarkup: 35000, taMarkup: 0 },
        inventorySummary: { homeCount: 7, rentedCount: 0, totalSites: 7, pricePerSqft: 362.42, pricePerSqftPerMonth: 362.42, totalSqft: 1048.5 },
        clientGrade: { unbilledSales: 0, effectiveSales: 0, paymentReceived: 0, outstandingSales: 0 },
        costSummary: { displayCost: 380000, printingCost: 0, installationCost: 10500, totalBeforeTax: 390500, gst: 70290, grandTotal: 460790 },
        documents: { emailConfirmations: 0, purchaseOrders: 0, others: 0 },
        status: 'Draft'
    },
    { id: '2', projectId: 'P00108', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-2', customerName: 'Matrix', displayName: 'Matrix ®', startDate: new Date('2025-07-24'), endDate: new Date('2025-08-22'), days: 30, status: 'Draft' },
    { id: '3', projectId: 'P00107', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-3', customerName: 'Founding Years Learning Solutions Pvt Ltd', displayName: 'Education', startDate: new Date('2025-07-25'), endDate: new Date('2025-10-22'), days: 90, status: 'Confirmed' },
    { id: '4', projectId: 'P00106', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-1', customerName: 'Matrix Network Solutions', displayName: 'Sonu', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-29'), days: 10, status: 'Active' },
    { id: '5', projectId: 'P00094', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-4', customerName: 'ADMINDS', displayName: 'Sunil Reddy', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-31'), days: 31, status: 'Draft' },
    { id: '6', projectId: 'P00105', employeeId: 'user-001', employee: { id: 'user-001', name: 'Raghu Gajula', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, customerId: 'customer-5', customerName: 'LAQSHYA MEDIA LIMITED', displayName: 'Quick delivery food campaign', startDate: new Date('2025-07-10'), endDate: new Date('2025-08-08'), days: 30, status: 'Draft' },
];

export default function NegotiationPage() {
  const [plan, setPlan] = React.useState<MediaPlan | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const params = useParams();

  React.useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    
    const fetchData = async () => {
        setLoading(true);
        const planDocRef = doc(db, 'plans', id);
        const planDoc = await getDoc(planDocRef);

        let foundPlan: MediaPlan | undefined;
        if (planDoc.exists()) {
             const data = planDoc.data() as DocumentData;
             foundPlan = {
                ...data,
                id: planDoc.id,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                createdAt: data.createdAt?.toDate(),
            } as MediaPlan;
        } else {
            foundPlan = sampleData.find(p => p.id === id);
        }
        
        if (foundPlan) {
            const customerDocRef = doc(db, 'customers', foundPlan.customerId);
            const customerDoc = await getDoc(customerDocRef);
            if (customerDoc.exists()) {
                foundPlan.customerName = customerDoc.data().name;
            }
            setPlan(foundPlan);
        }
        
        setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">Plan Not Found</h2>
            <p className="text-muted-foreground">The requested media plan could not be found.</p>
            <Button asChild className="mt-4">
                <Link href="/admin/media-plans">
                    <ChevronLeft className="mr-2" />
                    Back to All Plans
                </Link>
            </Button>
        </div>
    );
  }

  return <PlanNegotiation plan={plan} />;
}
