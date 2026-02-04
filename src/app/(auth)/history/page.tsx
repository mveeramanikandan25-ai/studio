import { HistoryList } from './components/history-list';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: 'Withdrawal History | CASHCHA',
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Withdrawal History</CardTitle>
          <CardDescription>Here are all your past and pending withdrawals.</CardDescription>
        </CardHeader>
      </Card>
      <HistoryList />
    </div>
  );
}
