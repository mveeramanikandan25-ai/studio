import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Terms & Conditions | CASHCHA',
};

export default function TermsAndConditionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          By downloading or using the app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.
        </p>
        <h3 className="font-semibold">1. Usage</h3>
        <p>
          You are not allowed to copy or modify the app, any part of the app, or our trademarks in any way. You are not allowed to attempt to extract the source code of the app, and you also shouldn’t try to translate the app into other languages or make derivative versions.
        </p>
        <h3 className="font-semibold">2. Account Termination</h3>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
        <h3 className="font-semibold">3. Changes to This Terms and Conditions</h3>
        <p>
          We may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes.
        </p>
        <p>
            This is a placeholder Terms and Conditions. You should replace this with your own comprehensive policy.
        </p>
      </CardContent>
    </Card>
  );
}
