
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
    // It simulates fetching a user profile after a short delay.
    const authenticateUser = async () => {
      // In a real Firebase Auth app, you would use `onAuthStateChanged` here.
      // For this mock, we'll simulate the process.
      setLoading(true);

      // 1. Mock user authentication.
      const mockAuthUser = {
        uid: 'superadmin-mock-uid',
        email: 'raghu@matrix-networksolutions.com' 
      };

      if (mockAuthUser) {
        // 2. Fetch user profile from Firestore.
        const userDocRef = doc(db, 'users', mockAuthUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            // 3. User profile exists, combine auth and profile data.
             let userData = {
              uid: mockAuthUser.uid,
              ...userDoc.data(),
            } as User;

            // Override role for superadmin for full access
            if (userData.email === 'raghu@matrix-networksolutions.com') {
                userData.role = 'superadmin';
            }

            setUser(userData);

          } else {
            // 4. Handle case where user is authenticated but has no profile document.
            // For this app, we'll create a default profile for the superadmin.
            if (mockAuthUser.email === 'raghu@matrix-networksolutions.com') {
                const superAdminUser: User = {
                    id: mockAuthUser.uid,
                    uid: mockAuthUser.uid,
                    name: 'Super Admin',
                    email: mockAuthUser.email,
                    role: 'superadmin',
                    companyId: 'company-1', // Default company for the superadmin
                    status: 'active',
                };
                // We could write this to Firestore here, but for now just setting it in state is enough.
                setUser(superAdminUser);
            } else {
                 // Regular user without a profile - treat as unauthenticated
                 setUser(null);
            }
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // This could be a permissions error if rules are not set correctly.
            // For now, we will treat it as a sign-out.
            setUser(null);
        }
      } else {
        // No authenticated user.
        setUser(null);
      }
      
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
