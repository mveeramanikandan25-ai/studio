'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FullScreenAd } from '@/components/ui/full-screen-ad';
import { Loader2, RefreshCw, Coins } from 'lucide-react';
import Image from 'next/image';

function generateCaptchaText(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

interface UserData {
    coins: number;
}

export function CaptchaCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const captchaImageUrl = useMemo(() => {
    if (!captchaText) return '';
    return `https://placehold.co/300x100/E0F7FA/29ABE2?text=${captchaText}&font=pt-sans`;
  }, [captchaText]);
  
  useEffect(() => {
    setCaptchaText(generateCaptchaText());
  }, []);

  const handleRefresh = () => {
    setCaptchaText(generateCaptchaText());
    setUserInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userInput.trim() === '' || !userDocRef) return;
    if (userInput.trim() !== captchaText) {
      toast({
        variant: 'destructive',
        title: 'Incorrect CAPTCHA',
        description: 'Please try again.',
      });
      handleRefresh();
      return;
    }

    setIsLoading(true);

    updateDocumentNonBlocking(userDocRef, {
        coins: increment(25),
    });

    toast({
      title: `+25 Coins!`,
      description: 'Your balance has been updated.',
      className: 'bg-accent text-accent-foreground',
    });
    setIsAdOpen(true);
    setIsLoading(false);
    handleRefresh();
  };
  
  const handleAdClose = () => {
    setIsAdOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Your Balance</CardTitle>
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <Coins className="h-6 w-6" />
              <span>{userData?.coins?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center rounded-lg bg-muted p-4">
              {captchaImageUrl && 
                <Image
                  src={captchaImageUrl}
                  alt="CAPTCHA"
                  width={300}
                  height={100}
                  className="rounded-md"
                  priority
                />
              }
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter CAPTCHA here"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
                required
                className="text-center tracking-widest font-mono"
              />
              <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit & Earn 25 Coins
            </Button>
          </CardFooter>
        </form>
      </Card>
      <FullScreenAd open={isAdOpen} onClose={handleAdClose} />
    </>
  );
}
