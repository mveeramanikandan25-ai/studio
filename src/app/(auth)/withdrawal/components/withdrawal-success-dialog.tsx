'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, PartyPopper } from 'lucide-react';

interface WithdrawalSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountInr: number;
}

export function WithdrawalSuccessDialog({ open, onOpenChange, amountInr }: WithdrawalSuccessDialogProps) {

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 4000); // Auto-close after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-sm w-[90%] rounded-xl border-none bg-gradient-to-br from-background to-secondary/70 p-8 shadow-2xl flex flex-col items-center justify-center text-center"
        hideCloseButton={true}
      >
        <div className="relative mb-6">
          <PartyPopper className="absolute -left-10 -top-5 h-8 w-8 text-yellow-400 rotate-[-20deg] animate-pop-in animation-delay-200" />
          <PartyPopper className="absolute -right-10 -top-5 h-8 w-8 text-pink-400 rotate-[20deg] animate-pop-in animation-delay-400" />
          <div className="relative w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center animate-pop-in">
            <CheckCircle2 className="h-16 w-16 text-accent-foreground animate-coin-shine" />
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline animate-fade-in-up">
            Success!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 animate-fade-in-up animation-delay-200">
            You've successfully redeemed INR {amountInr}. Your request is being processed.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)} className="mt-6 w-full animate-fade-in-up animation-delay-600">Done</Button>
      </DialogContent>
    </Dialog>
  );
}
