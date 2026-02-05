'use client';

import { useState } from 'react';
import { useAuth, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function generateReferralCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Firebase not initialized." });
        setIsLoading(false);
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            const referralCode = sessionStorage.getItem('referralCode');
            let referredByCode: string | null = null;
            let signupBonus = 100;

            if (referralCode) {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where('referralCode', '==', referralCode));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const referrerDoc = querySnapshot.docs[0];
                    if(referrerDoc.id !== user.uid) { // Prevent user from referring themselves
                        const referrerRef = doc(firestore, 'users', referrerDoc.id);
                        
                        updateDocumentNonBlocking(referrerRef, {
                            coins: increment(100)
                        });

                        signupBonus = 200; // 100 standard + 100 referral
                        referredByCode = referralCode;
                        sessionStorage.removeItem('referralCode'); // Clean up

                        toast({ title: 'Referral success!', description: 'You and your friend both received 100 bonus coins.' });
                    }
                }
            }

            await setDoc(userRef, {
                id: user.uid,
                googleId: user.providerData.find(p => p.providerId === GoogleAuthProvider.PROVIDER_ID)?.uid || user.uid,
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL,
                coins: signupBonus,
                referralCode: generateReferralCode(6),
                referredBy: referredByCode,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                language: 'en',
                theme: 'system',
            });
            
            if (!referredByCode) {
                 toast({ title: 'Welcome!', description: `You received a ${signupBonus} coin signup bonus.` });
            }
        } else {
            toast({ title: 'Welcome back!' });
        }
        
        router.replace('/earn');

    } catch (error: any) {
        setIsLoading(false);
        if (error.code === 'auth/popup-blocked') {
            toast({
                variant: 'destructive',
                title: 'Sign-in popup blocked',
                description: 'Please allow popups for this site and try again.',
            });
        } else if (error.code === 'auth/cancelled-popup-request') {
            // User closed the popup, do nothing.
        }
        else {
            console.error('Google Sign-In Error:', error);
            toast({
                variant: 'destructive',
                title: 'Sign-in failed',
                description: 'An unexpected error occurred. Please try again.',
            });
        }
    }
  };

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <Button
      variant="outline"
      className="w-full h-12 text-base border-primary/30 bg-primary/10 text-foreground backdrop-blur-sm hover:bg-primary/20"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Continue with Google
    </Button>
  );
}
