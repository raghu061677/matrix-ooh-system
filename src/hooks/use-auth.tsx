
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types/firestore';

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
    // It simulates fetching a user profile after a short delay.
    const timer = setTimeout(() => {
      const mockUser: User = {
        id: 'superadmin-mock-id',
        uid: 'superadmin-mock-uid',
        name: 'Super Admin',
        email: 'raghu@matrix-networksolutions.com',
        role: 'superadmin',
        companyId: 'company-1', // A mock company ID
        status: 'active',
      };
      
      setUser(mockUser);
      setLoading(false);
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
