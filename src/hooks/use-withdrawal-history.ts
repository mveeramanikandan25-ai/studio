'use client';

import {
  collection,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';

export interface Withdrawal {
  id: string;
  amountCoins: number;
  amountInr: number;
  createdAt: Timestamp;
  method: 'UPI' | 'Google Play';
  status: 'Pending' | 'Success' | 'Failed';
  userId: string;
}

export function useWithdrawalHistory() {
  const { user } = useUser();
  const firestore = useFirestore();

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'withdrawals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: withdrawals, isLoading: loading } = useCollection<Withdrawal>(withdrawalsQuery);

  return { withdrawals: withdrawals || [], loading };
}
