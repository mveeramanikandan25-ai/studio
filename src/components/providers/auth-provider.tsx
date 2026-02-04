'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createUserInDb } from '@/lib/actions';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  coins: number;
  referralCode: string;
  createdAt: any;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await createUserInDb(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName,
          firebaseUser.photoURL
        );
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          }
        });
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userData, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
