'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { useUser, useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function generateReferralCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);


  useEffect(() => {
    async function processRedirect() {
      if (!auth || !firestore) return;

      try {
        const result = await getRedirectResult(auth);
        
        // If there's a result, it means we just came from a redirect.
        if (result && result.user) {
          const user = result.user;
          const userRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            // New user logic
            const googleProviderData = user.providerData.find(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
            setDocumentNonBlocking(userRef, {
                id: user.uid,
                googleId: googleProviderData?.uid || user.uid,
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL,
                coins: 100, // Signup bonus
                referralCode: generateReferralCode(5),
                referredBy: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                language: 'en',
                theme: 'system',
            }, { merge: true });
            
            toast({
              title: 'Welcome!',
              description: 'You received a 100 coin signup bonus.',
            });
          } else {
            // Existing user
            toast({
              title: 'Welcome back!',
              description: 'Signed in successfully.',
            });
          }
        }
      } catch (error) {
        console.error('Google Sign-In Redirect Error:', error);
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: 'There was a problem with your sign-in request.',
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    }
    processRedirect();
  }, [auth, firestore, toast]);

  useEffect(() => {
    // Once the user object is available (and we're not still processing the redirect), navigate.
    if (!isUserLoading && user && !isProcessingRedirect) {
      router.replace('/earn');
    }
  }, [user, isUserLoading, router, isProcessingRedirect]);

  // Show loader while checking auth state or processing redirect.
  // Also show loader if user is logged in, to mask the brief moment before redirect.
  if (isUserLoading || isProcessingRedirect || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Only show sign-in page if no user and not loading.
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
