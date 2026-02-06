'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  coins: number;
  lastDailyRewardClaimed?: string; // YYYY-MM-DD
  dailyRewardStreak?: number; // 1-7
}

const DAILY_REWARDS = [10, 20, 30, 40, 50, 60, 100]; // 7-day rewards

export function DailyLoginCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const streak = userData?.dailyRewardStreak || 0;
  const canClaim = userData?.lastDailyRewardClaimed !== today;

  const handleClaim = () => {
    if (!userDocRef || !canClaim) return;
    setIsLoading(true);

    const rewardAmount = DAILY_REWARDS[streak % 7];
    const newStreak = streak + 1;

    updateDocumentNonBlocking(userDocRef, {
      coins: increment(rewardAmount),
      lastDailyRewardClaimed: today,
      dailyRewardStreak: newStreak,
    });
    
    setTimeout(() => {
        toast({
            title: 'Reward Claimed!',
            description: `You've received ${rewardAmount} coins.`,
            className: 'bg-primary text-primary-foreground',
        });
        setIsLoading(false);
    }, 1000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Login Reward</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center">
          {DAILY_REWARDS.map((reward, index) => {
            const day = index + 1;
            const isClaimed = streak >= day;
            const isToday = streak + 1 === day && canClaim;

            return (
              <div
                key={day}
                className={cn(
                  'p-2 rounded-lg flex flex-col items-center justify-center space-y-1 border',
                  isClaimed && !isToday ? 'bg-primary/20 border-primary/30' : 'bg-muted/50',
                  isToday && 'border-primary ring-2 ring-primary shadow-lg'
                )}
                style={isToday ? {
                    boxShadow: '0 0 15px hsl(var(--primary) / 0.7)'
                } : {}}
              >
                <span className="text-xs text-muted-foreground">Day {day}</span>
                 {isClaimed && !isToday ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <Gift className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm font-bold">{reward}</span>
              </div>
            );
          })}
        </div>
        <Button onClick={handleClaim} disabled={!canClaim || isLoading} className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> :
           canClaim ? 'Claim Today\'s Reward' : 'Claimed for Today'}
        </Button>
      </CardContent>
    </Card>
  );
}
