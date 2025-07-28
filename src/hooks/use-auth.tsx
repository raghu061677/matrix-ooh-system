
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseApp, db } from '@/lib/firebase';
import { User } from '@/types/firestore';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              let userData = { id: userDoc.id, uid: userDoc.id, ...userDoc.data() } as User;
              
              // Hardcode the superadmin role for the specified email
              if (userData.email === 'raghu@matrix-networksolutions.com') {
                userData.role = 'superadmin';
              }
              
              setUser(userData);
            } else {
              console.warn(`No user document found in Firestore for UID: ${fbUser.uid}`);
              // If it's the superadmin email, create a temporary user object
              if (fbUser.email === 'raghu@matrix-networksolutions.com') {
                  setUser({
                      id: fbUser.uid,
                      uid: fbUser.uid,
                      name: 'Raghu (Super Admin)',
                      email: fbUser.email,
                      role: 'superadmin',
                      status: 'active'
                  });
              } else {
                  setUser(null);
              }
            }
        } catch (error) {
            console.error("Error fetching user document from Firestore:", error);
            setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
