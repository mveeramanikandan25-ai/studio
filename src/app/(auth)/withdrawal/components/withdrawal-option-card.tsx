'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Coins } from 'lucide-react';
import { WithdrawalDialog } from './withdrawal-dialog';
import { cn } from '@/lib/utils';

interface WithdrawalOption {
  coins: number;
  inr: number;
}

interface WithdrawalOptionCardProps {
  option: WithdrawalOption;
}

export function WithdrawalOptionCard({ option }: WithdrawalOptionCardProps) {
  const { userData } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
          <h3 className="text-2xl font-bold text-primary">₹{option.inr}</h3>
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
