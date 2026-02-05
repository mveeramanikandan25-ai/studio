'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const WithdrawalDialog = dynamic(() => import('./withdrawal-dialog').then(mod => mod.WithdrawalDialog), { ssr: false });
const WithdrawalSuccessDialog = dynamic(() => import('./withdrawal-success-dialog').then(mod => mod.WithdrawalSuccessDialog), { ssr: false });

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
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);
  
  const hasEnoughCoins = userData ? userData.coins >= option.coins : false;

  const handleSuccess = () => {
    setIsSuccessDialogOpen(true);
  };

  return (
    <>
      <Card
        className={cn(
          'flex flex-col text-center transition-all',
          !hasEnoughCoins && 'bg-muted/50 text-muted-foreground'
        )}
      >
        <CardContent className="p-4 flex-grow flex flex-col items-center justify-center gap-2">
          <h3 className="text-2xl font-bold text-primary">INR {option.inr}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Coins className="h-4 w-4" />
            <span>{option.coins.toLocaleString()}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button
                className="w-full"
                onClick={() => setIsDialogOpen(true)}
                disabled={!hasEnoughCoins}
            >
                Claim
            </Button>
        </CardFooter>
      </Card>
      {isDialogOpen && <WithdrawalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        option={option}
        onSuccess={handleSuccess}
      />}
      {isSuccessDialogOpen && <WithdrawalSuccessDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        amountInr={option.inr}
      />}
    </>
  );
}
