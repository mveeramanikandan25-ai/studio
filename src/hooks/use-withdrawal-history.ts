'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';

export interface Withdrawal {
  id: string;
  amountCoins: number;
  amountInr: number;
  createdAt: Timestamp;
  method: 'UPI' | 'Google Play';
  status: 'Pending' | 'Success';
  userId: string;
}

export function useWithdrawalHistory() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const history: Withdrawal[] = [];
        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, ...doc.data() } as Withdrawal);
        });
        setWithdrawals(history);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching withdrawal history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { withdrawals, loading };
}
