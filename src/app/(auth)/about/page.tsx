import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'About Us | CASHCHA',
};

export default function AboutUsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">About CASHCHA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
            Welcome to CASHCHA, the premier application that rewards you for your time and attention. Our mission is to provide a simple, fun, and secure way for users to earn real rewards by completing simple tasks.
        </p>
        <p>
            We believe that everyone's time is valuable. That's why we've created a platform where you can easily convert your spare moments into tangible rewards. Whether you're waiting in line, commuting, or just have a few minutes to spare, CASHCHA makes it easy to earn.
        </p>
        <p>
            Thank you for being a part of our community. We are constantly working to improve your experience and add new, exciting ways for you to earn.
        </p>
        <p>
            Happy Earning!
        </p>
        <p className="font-semibold">- The CASHCHA Team</p>
      </CardContent>
    </Card>
  );
}
