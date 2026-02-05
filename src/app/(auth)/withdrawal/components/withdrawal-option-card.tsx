'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Coins } from 'lucide-react';
import { WithdrawalDialog } from './withdrawal-dialog';
import { cn } from '@/lib/utils';

interface WithdrawalOption {
  coins: number;
  inr: number;
}

interface UserData {
    coins: number;
}

interface WithdrawalOptionCardProps {
  option: WithdrawalOption;
}

export function WithdrawalOptionCard({ option }: WithdrawalOptionCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);
  
  const hasEnoughCoins = userData ? userData.coins >= option.coins : false;

  return (
    <>
      <Card
        className={cn(
          'flex flex-col items-center justify-center text-center p-4 transition-all',
          !hasEnoughCoins ? 'bg-muted/50 text-muted-foreground' : 'cursor-pointer hover:bg-primary/5 hover:shadow-lg'
        )}
        onClick={() => hasEnoughCoins && setIsDialogOpen(true)}
      >
        <CardContent className="p-0 flex flex-col items-center gap-2">
          <h3 className="text-2xl font-bold text-primary">INR {option.inr}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Coins className="h-4 w-4" />
            <span>{option.coins.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
      <WithdrawalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        option={option}
      />
    </>
  );
}
