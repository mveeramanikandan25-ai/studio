'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Coins, PartyPopper } from 'lucide-react';

const WELCOME_DIALOG_SHOWN_KEY = 'welcomeDialogShown';

export function WelcomeDialog() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const hasBeenShown = sessionStorage.getItem(WELCOME_DIALOG_SHOWN_KEY);
      if (!hasBeenShown) {
        setIsOpen(true);
        sessionStorage.setItem(WELCOME_DIALOG_SHOWN_KEY, 'true');
      }
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 3500); // Auto-close after 3.5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="max-w-sm w-[90%] rounded-xl border-none bg-gradient-to-br from-background to-secondary/70 p-8 shadow-2xl flex flex-col items-center justify-center text-center"
        hideCloseButton={true}
      >
        <div className="relative mb-6">
            <PartyPopper className="absolute -left-10 -top-5 h-8 w-8 text-yellow-400 rotate-[-20deg] animate-pop-in animation-delay-200" />
            <PartyPopper className="absolute -right-10 -top-5 h-8 w-8 text-pink-400 rotate-[20deg] animate-pop-in animation-delay-400" />
            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-pulse-slow blur-xl"></div>
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pop-in">
                <Coins className="h-12 w-12 text-primary animate-coin-shine" />
            </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline animate-fade-in-up">
            Welcome, {user.displayName?.split(' ')[0] || 'User'}!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 animate-fade-in-up animation-delay-200">
            You're all set to start earning.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
