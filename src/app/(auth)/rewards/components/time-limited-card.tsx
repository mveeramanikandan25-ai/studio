'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  nextBonusUnlockTime?: Timestamp;
}

const BONUS_REWARD = 200;
const BONUS_COOLDOWN_HOURS = 24;

export function TimeLimitedCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  useEffect(() => {
    if (!userData) return;

    const interval = setInterval(() => {
      const unlockTime = userData.nextBonusUnlockTime?.toDate();
      if (!unlockTime) {
        setCanClaim(true);
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }
      
      const now = new Date();
      const diff = unlockTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCanClaim(true);
        setTimeLeft('00:00:00');
        clearInterval(interval);
      } else {
        setCanClaim(false);
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData]);

  const handleClaim = () => {
    if (!userDocRef || !canClaim) return;
    setIsLoading(true);

    const newUnlockTime = new Date();
    newUnlockTime.setHours(newUnlockTime.getHours() + BONUS_COOLDOWN_HOURS);
    
    updateDocumentNonBlocking(userDocRef, {
        coins: increment(BONUS_REWARD),
        nextBonusUnlockTime: newUnlockTime,
    });
    
    setTimeout(() => {
        toast({
            title: 'Bonus Claimed!',
            description: `You've received ${BONUS_REWARD} bonus coins.`,
            className: 'bg-primary text-primary-foreground',
        });
        setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer /> Time Limited Reward
        </CardTitle>
        <CardDescription>Claim a big bonus every 24 hours.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {!canClaim ? (
          <div>
            <p className="text-sm text-muted-foreground">Next Bonus Available In…</p>
            <p className="text-4xl font-bold font-mono text-destructive animate-pulse">{timeLeft || 'Loading...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Gift className="h-10 w-10 text-primary" />
            <p className="font-semibold">Your bonus is ready!</p>
          </div>
        )}
        <Button onClick={handleClaim} disabled={!canClaim || isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin" /> :
             canClaim ? `Unlock ${BONUS_REWARD} Coins` : 'Locked'}
        </Button>
      </CardContent>
    </Card>
  );
}
