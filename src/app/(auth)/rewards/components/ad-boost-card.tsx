'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clapperboard, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';

const FullScreenAd = dynamic(() => import('@/components/ui/full-screen-ad').then(mod => mod.FullScreenAd), { ssr: false });

interface UserData {
    lastAdBoostDate?: string; // YYYY-MM-DD
    adBoostsToday?: number;
}

const MAX_ADS_PER_DAY = 3;
const AD_REWARD = 100; // The "2X" reward

export function AdBoostCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const today = new Date().toISOString().split('T')[0];
  const adsWatchedToday = userData?.lastAdBoostDate === today ? (userData.adBoostsToday || 0) : 0;
  const canWatchAd = adsWatchedToday < MAX_ADS_PER_DAY;

  const handleWatchAd = () => {
    if (!canWatchAd || !userDocRef) return;
    setIsLoading(true);
    // Simulate ad loading
    setTimeout(() => {
        setIsAdOpen(true);
        setIsLoading(false);
    }, 500);
  };
  
  const handleAdClose = () => {
    setIsAdOpen(false);
    if (!userDocRef) return;
    
    const currentBoosts = userData?.lastAdBoostDate === today ? (userData.adBoostsToday || 0) : 0;
    
    updateDocumentNonBlocking(userDocRef, {
        coins: increment(AD_REWARD),
        lastAdBoostDate: today,
        adBoostsToday: currentBoosts + 1,
    });
    
    toast({
      title: 'Reward Doubled Successfully!',
      description: `You've received ${AD_REWARD} bonus coins.`,
      className: 'bg-primary text-primary-foreground',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clapperboard /> Ad Boost Reward
          </CardTitle>
          <CardDescription>Watch a short ad to earn bonus coins!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
           <Button onClick={handleWatchAd} disabled={!canWatchAd || isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin"/> : "Watch Ad & Get 2X Coins"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {MAX_ADS_PER_DAY - adsWatchedToday} / {MAX_ADS_PER_DAY} boosts left today.
          </p>
        </CardContent>
      </Card>
      {isAdOpen && <FullScreenAd open={isAdOpen} onClose={handleAdClose} />}
    </>
  );
}
