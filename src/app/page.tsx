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

  // Show loader while checking for an existing session.
  // Also show loader if user is found, to hide the brief moment before redirect.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Only show sign-in page if no user and not loading.
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-8 text-center text-white">
      <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl animate-fade-in" />
      <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-destructive/10 blur-3xl animate-fade-in animation-delay-200" />
      
      <div className="relative z-10 flex flex-col items-center space-y-8">
        <div className="flex items-center gap-4 animate-fade-in-down">
          <Coins className="h-16 w-16 text-primary drop-shadow-[0_0_15px_hsl(var(--primary))]" />
          <h1 className="text-6xl font-bold tracking-tighter text-white sm:text-7xl md:text-8xl font-headline">
            CASHCHA
          </h1>
        </div>
        
        <p className="max-w-md text-slate-300 sm:text-lg animate-fade-in-up animation-delay-200">
          Get rewarded for your time. Solve CAPTCHAs, earn coins, and redeem for real cash.
        </p>

        <div className="w-full max-w-xs animate-fade-in-up animation-delay-400">
          <GoogleSignInButton />
        </div>

        <p className="px-8 text-center text-xs text-slate-400 animate-fade-in-up animation-delay-600">
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
