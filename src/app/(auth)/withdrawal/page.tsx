import { WITHDRAWAL_OPTIONS } from '@/lib/constants';
import { WithdrawalOptionCard } from './components/withdrawal-option-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { UserBalance } from './components/user-balance';

export const metadata = {
  title: 'Withdraw | CASHCHA',
};

export default async function WithdrawalPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Withdraw Coins</CardTitle>
          <CardDescription>Redeem your coins for real rewards. Select an option below.</CardDescription>
        </CardHeader>
        <CardContent>
            <UserBalance />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {WITHDRAWAL_OPTIONS.map((option) => (
          <WithdrawalOptionCard key={option.coins} option={option} />
        ))}
      </div>
    </div>
  );
}
