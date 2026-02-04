import { CaptchaCard } from './components/captcha-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';

export const metadata = {
  title: 'Earn Coins | CASHCHA',
};

export default function EarnPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Welcome Back!</CardTitle>
          <CardDescription>Solve the CAPTCHA below to earn coins.</CardDescription>
        </CardHeader>
      </Card>

      <CaptchaCard />
    </div>
  );
}
