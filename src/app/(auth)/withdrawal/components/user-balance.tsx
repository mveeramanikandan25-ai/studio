'use client';

import { useAuth } from '@/hooks/use-auth';
import { Coins } from 'lucide-react';

export function UserBalance() {
  const { userData } = useAuth();
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
