'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/earn');
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-5xl font-bold tracking-tighter text-primary sm:text-6xl md:text-7xl font-headline">
          CASHCHA
        </div>
        <p className="max-w-md text-muted-foreground sm:text-lg">
          Get rewarded for your time. Solve CAPTCHAs, earn coins, and redeem for real cash.
        </p>
        <div className="w-full max-w-xs">
          <GoogleSignInButton />
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
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
