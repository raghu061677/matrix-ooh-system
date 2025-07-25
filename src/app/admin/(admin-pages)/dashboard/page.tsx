
'use client';

import { useState } from 'react';
import { CompanyDashboard } from '@/components/admin/company-dashboard';
import { SuperAdminDashboard } from '@/components/admin/super-admin-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // In a real implementation, you would check the user's role like this:
  const isSuperAdmin = user?.role === 'superadmin';

  if (isSuperAdmin) {
    return (
       <div>
        <div className="flex justify-end mb-4">
            <Button onClick={() => setShowSuperAdmin(!showSuperAdmin)}>
                {showSuperAdmin ? "View Company Dashboard" : "View Superadmin Dashboard"}
            </Button>
        </div>
        {showSuperAdmin ? <SuperAdminDashboard /> : <CompanyDashboard />}
      </div>
    )
  }
  
  return <CompanyDashboard />;
}
