'use client';

import { useWithdrawalHistory, type Withdrawal } from '@/hooks/use-withdrawal-history';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Banknote, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

function HistoryItem({ withdrawal }: { withdrawal: Withdrawal }) {
  const isUpi = withdrawal.method === 'UPI';

  return (
    <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full", isUpi ? 'bg-primary/10' : 'bg-destructive/10')}>
                    {isUpi ? (
                        <Banknote className="h-6 w-6 text-primary" />
                    ) : (
                        <Gift className="h-6 w-6 text-destructive" />
                    )}
                </div>
                <div>
                    <p className="font-semibold">{withdrawal.method} Withdrawal</p>
                    <p className="text-sm text-muted-foreground">
                        {withdrawal.createdAt?.toDate().toLocaleDateString() ?? 'Just now'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">₹{withdrawal.amountInr}</p>
                <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                    <Coins className="h-3 w-3" />
                    <span>{withdrawal.amountCoins.toLocaleString()}</span>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-2 bg-muted/50">
             <Badge className={cn(
                'ml-auto', 
                withdrawal.status === 'Success' && 'bg-accent text-accent-foreground hover:bg-accent/80',
                withdrawal.status === 'Pending' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                withdrawal.status === 'Failed' && 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
              )}>
                {withdrawal.status}
            </Badge>
        </CardFooter>
    </Card>
  );
}

function HistorySkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-6 w-12 ml-auto" />
                            <Skeleton className="h-4 w-16 ml-auto" />
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-muted/50">
                        <Skeleton className="h-6 w-20 ml-auto" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export function HistoryList() {
  const { withdrawals, loading } = useWithdrawalHistory();

  if (loading) {
    return <HistorySkeleton />;
  }

  if (withdrawals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <p>You haven't made any withdrawals yet.</p>
        <p className="text-sm">Start earning and redeem your first reward!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawals.map((w) => (
        <HistoryItem key={w.id} withdrawal={w} />
      ))}
    </div>
  );
}
