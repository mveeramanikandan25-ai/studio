'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Coins } from 'lucide-react';

interface UserData {
    coins: number;
}

export function UserBalance() {
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  return (
    <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
      <span className="text-sm font-medium text-primary">Your Balance:</span>
      <div className="flex items-center gap-2 text-lg font-bold text-primary">
        <Coins className="h-5 w-5" />
        <span>{userData?.coins?.toLocaleString() ?? 0}</span>
      </div>
    </div>
  );
}
