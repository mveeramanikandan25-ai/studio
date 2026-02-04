'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FullScreenAdProps {
  open: boolean;
  onClose: () => void;
}

export function FullScreenAd({ open, onClose }: FullScreenAdProps) {
  const [canClose, setCanClose] = useState(false);
  const [progress, setProgress] = useState(0);
  const adDuration = 5; // seconds

  useEffect(() => {
    if (open) {
      setCanClose(false);
      setProgress(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => prev + 100 / adDuration);
      }, 1000);

      const timer = setTimeout(() => {
        setCanClose(true);
        clearInterval(progressInterval);
        setProgress(100);
      }, adDuration * 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? null : onClose()}>
      <DialogContent className="sm:max-w-[425px] h-full w-full max-w-full flex flex-col p-0 gap-0 sm:h-auto sm:max-h-[90vh]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Advertisement</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-muted/20 p-4">
          <p className="text-muted-foreground text-center">
            Your amazing ad content goes here.
            <br/>
            Imagine something captivating!
          </p>
        </div>
        <DialogFooter className="p-4 border-t flex-col sm:flex-col sm:space-x-0 gap-2">
            <Progress value={progress} className="w-full h-2" />
            <Button onClick={onClose} disabled={!canClose} className="w-full">
              {canClose ? 'Close Ad' : `Close in ${Math.ceil(adDuration - (progress / 100 * adDuration))}s`}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
