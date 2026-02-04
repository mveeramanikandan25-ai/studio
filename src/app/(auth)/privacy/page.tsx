import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy | CASHCHA',
};

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Your privacy is important to us. It is CASHCHA's policy to respect your privacy regarding any information we may collect from you across our application.
        </p>
        <h3 className="font-semibold">1. Information we collect</h3>
        <p>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
        </p>
        <h3 className="font-semibold">2. How we use your information</h3>
        <p>
          We use the information we collect to operate, maintain, and provide the features and functionality of the app, including processing your withdrawals and managing your account.
        </p>
        <h3 className="font-semibold">3. Security</h3>
        <p>
          We are committed to protecting your information. We use a variety of security technologies and measures to protect your information from unauthorized access, use, or disclosure.
        </p>
        <p>
            This is a placeholder privacy policy. You should replace this with your own comprehensive policy.
        </p>
      </CardContent>
    </Card>
  );
}
