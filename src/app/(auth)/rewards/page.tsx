import { DailyLoginCard } from './components/daily-login-card';
import { AdBoostCard } from './components/ad-boost-card';
import { TimeLimitedCard } from './components/time-limited-card';
import { LuckySpinCard } from './components/lucky-spin-card';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Rewards | CASHCHA',
};

export default function RewardsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daily Rewards</CardTitle>
          <CardDescription>Claim your daily rewards and boost your earnings.</CardDescription>
        </CardHeader>
      </Card>

      <DailyLoginCard />
      <AdBoostCard />
      <TimeLimitedCard />
      <LuckySpinCard />
    </div>
  );
}
