'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Copy, LogOut } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { ShareButtons } from './share-buttons';

interface UserData {
    displayName: string;
    email: string;
    coins: number;
    referralCode: string;
    photoURL?: string;
}

export function ProfileClient() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

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

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </>
  );
}
