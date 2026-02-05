
'use client';

import { useState } from 'react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Coins, Copy, LogOut, Loader2 } from 'lucide-react';
import { doc, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { ShareButtons } from './share-buttons';

interface UserData {
    displayName: string;
    email: string;
    coins: number;
    referralCode: string;
    photoURL?: string;
    referredBy?: string;
}

export function ProfileClient() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [manualReferralCode, setManualReferralCode] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc<UserData>(userDocRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    toast({ title: 'Logged out successfully.' });
  };

  const handleCopyReferralCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      toast({ title: 'Referral code copied!' });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !manualReferralCode.trim() || userData?.referredBy) return;

    setIsSubmittingReferral(true);
    const codeToSubmit = manualReferralCode.trim().toUpperCase();

    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('referralCode', '==', codeToSubmit));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: 'Invalid Referral Code', description: 'Please check the code and try again.' });
            setIsSubmittingReferral(false);
            return;
        }

        const referrerDoc = querySnapshot.docs[0];
        if (referrerDoc.id === user.uid) {
            toast({ variant: 'destructive', title: "You can't refer yourself.", description: 'Please enter a code from a friend.' });
            setIsSubmittingReferral(false);
            return;
        }

        // Everything is valid, proceed with batch write
        const batch = writeBatch(firestore);

        // Update current user
        const currentUserRef = doc(firestore, 'users', user.uid);
        batch.update(currentUserRef, {
            coins: increment(100),
            referredBy: codeToSubmit,
        });

        // Update referrer
        const referrerRef = doc(firestore, 'users', referrerDoc.id);
        batch.update(referrerRef, {
            coins: increment(100),
        });

        await batch.commit();

        toast({
            title: 'Success!',
            description: 'You and your friend both received 100 bonus coins.',
            className: 'bg-accent text-accent-foreground',
        });
        setManualReferralCode('');

    } catch (error) {
        console.error("Error submitting referral code:", error);
        toast({
            variant: 'destructive',
            title: 'Something went wrong',
            description: 'Could not apply referral code. Please try again.',
        });
    } finally {
        setIsSubmittingReferral(false);
    }
};

  return (
    <>
      <Card>
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={userData?.photoURL || user?.photoURL || ''} alt={userData?.displayName || user?.displayName || 'User'} />
            <AvatarFallback className="text-3xl">{getInitials(userData?.displayName || user?.displayName || 'U')}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-headline">{userData?.displayName}</h2>
            <p className="text-muted-foreground">{userData?.email}</p>
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Coins className="h-7 w-7" />
            <span>{userData?.coins?.toLocaleString() ?? 0}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Refer & Earn</CardTitle>
          <CardDescription>Share your code and earn 100 coins when a friend signs up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-4">
                <span className="font-mono text-lg font-semibold tracking-widest">{userData?.referralCode}</span>
                <Button size="icon" variant="ghost" onClick={handleCopyReferralCode} aria-label="Copy referral code">
                    <Copy className="h-5 w-5"/>
                </Button>
            </div>
            {userData?.referralCode && <ShareButtons referralCode={userData.referralCode} />}
        </CardContent>
      </Card>

      {!isUserDocLoading && !userData?.referredBy && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Referral Code</CardTitle>
            <CardDescription>Did a friend refer you? Enter their code here to get 100 bonus coins.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReferralSubmit} className="flex items-center gap-2">
              <Input
                placeholder="ENTERCODE"
                value={manualReferralCode}
                onChange={(e) => setManualReferralCode(e.target.value.toUpperCase())}
                disabled={isSubmittingReferral}
                autoCapitalize="off"
                autoCorrect="off"
                className="font-mono tracking-widest"
              />
              <Button type="submit" disabled={isSubmittingReferral || !manualReferralCode.trim()}>
                {isSubmittingReferral && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </>
  );
}
