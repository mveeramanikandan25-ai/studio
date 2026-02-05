'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Coins } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If we have a user from an existing session, redirect to the app.
    if (!isUserLoading && user) {
      router.replace('/earn');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // On page load, check for a referral code in the URL and store it.
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('referralCode', refCode);
    }
  }, []);

  // Show loader while checking for an existing session or during redirect.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Login page UI
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden p-8 text-center">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background" />
      <div className="absolute top-0 left-0 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl animate-fade-in" />
      <div className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-full bg-gradient-to-tl from-accent/10 to-transparent blur-3xl animate-fade-in animation-delay-200" />
      <div className="absolute inset-0 -z-10 h-full w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
      
      <div className="relative z-10 flex flex-col items-center pt-16 animate-fade-in-down">
        <Coins className="h-20 w-20 text-glow" />
        <h1 className="mt-4 text-5xl font-bold tracking-tighter text-glow sm:text-6xl font-headline">
          CASHCHA
        </h1>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center space-y-6 animate-fade-in-up">
        <p className="max-w-md text-muted-foreground sm:text-lg">
          Get rewarded for your time. Solve CAPTCHAs, earn coins, and redeem for real cash.
        </p>

        <div className="w-full">
          <GoogleSignInButton />
        </div>

        <p className="px-8 text-center text-xs text-muted-foreground/80">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
