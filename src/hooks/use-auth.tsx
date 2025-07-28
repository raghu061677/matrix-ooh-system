
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a simplified mock authentication.
    // It instantly provides a mock superadmin user to bypass all auth checks.
    const authenticateUser = async () => {
      setLoading(true);
      const superAdminUser: User = {
          id: 'superadmin-mock-uid',
          uid: 'superadmin-mock-uid',
          name: 'Super Admin',
          email: 'raghu@matrix-networksolutions.com',
          role: 'superadmin',
          companyId: 'company-1', // Default company for the superadmin
          status: 'active',
      };
      setUser(superAdminUser);
      setLoading(false);
    };

    authenticateUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
