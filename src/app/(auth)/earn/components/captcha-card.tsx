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
  const [captchaKey, setCaptchaKey] = useState(0); // To force re-render captcha

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const captchaImageUrl = useMemo(() => {
    if (!captchaText || typeof window === 'undefined') return '';

    // Dynamically get theme colors
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;
    
    const chars = captchaText.split('').map((char, index) => {
        const rotation = Math.random() * 20 - 10;
        const translateY = Math.random() * 6 - 3;
        const scale = Math.random() * 0.2 + 0.9;
        const xPos = 25 + index * 45;
        return `<text
          x="${xPos}"
          y="60"
          transform="rotate(${rotation} ${xPos} 60) translate(0 ${translateY}) scale(${scale})"
          font-size="45"
          font-family="Orbitron, sans-serif"
          font-weight="bold"
          fill="${primaryColor}"
          text-anchor="middle"
        >
          ${char}
        </text>`;
    }).join('');
    
    const noise = Array.from({length: 5}).map(() => {
        const x1 = Math.random() * 300;
        const y1 = Math.random() * 100;
        const x2 = Math.random() * 300;
        const y2 = Math.random() * 100;
        const opacity = Math.random() * 0.3 + 0.2;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${primaryColor}" stroke-width="1.5" opacity="${opacity}" />`;
    }).join('');

    const svg = `
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg" style="background-color: transparent; border-radius: 8px;">
        ${noise}
        <g>
          ${chars}
        </g>
      </svg>
    `;
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaText, captchaKey]);
  
  useEffect(() => {
    setCaptchaText(generateCaptchaText());
  }, [captchaKey]);

  const handleRefresh = () => {
    setCaptchaKey(prev => prev + 1);
    setUserInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userInput.trim() === '' || !userDocRef) return;
    if (userInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
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
      className: 'bg-primary text-primary-foreground',
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
              {captchaImageUrl ?
                <Image
                  src={captchaImageUrl}
                  alt="CAPTCHA"
                  width={300}
                  height={100}
                  className="rounded-md"
                />
                : <div className="h-[100px] w-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                autoCapitalize="off"
                autoCorrect="off"
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
