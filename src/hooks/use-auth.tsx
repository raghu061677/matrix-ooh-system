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
              const userData = { id: userDoc.id, uid: userDoc.id, ...userDoc.data() } as User;
              setUser(userData);
            } else {
              // This case can happen if a user exists in Firebase Auth but not in Firestore.
              // For a secure app, you might want to log them out or create a default profile.
              console.warn(`No user document found in Firestore for UID: ${fbUser.uid}`);
              setUser(null);
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
