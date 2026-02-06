'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LuckySpinCard() {
  return (
    <Card className="relative overflow-hidden bg-muted/30">
        <CardHeader>
            <CardTitle className="text-lg">Lucky Spin</CardTitle>
            <CardDescription>Try your luck for a big prize!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center p-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Feature coming soon!</p>
            </div>
            <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">Daily 1 Free Spin</Badge>
        </CardContent>
    </Card>
  );
}
