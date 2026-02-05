'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Smartphone, Copy } from 'lucide-react';

interface ShareButtonsProps {
  referralCode: string;
}

export function ShareButtons({ referralCode }: ShareButtonsProps) {
  const { toast } = useToast();

  if (!referralCode || typeof window === 'undefined') {
    return null;
  }

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const shareMessage = `Join this CAPTCHA earning app and get 100 free coins! Use my referral code: ${referralCode}. Download here: ${referralLink}`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-6 w-6" />,
      action: () => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
      }
    },
    {
        name: 'Telegram',
        icon: <Send className="h-6 w-6" />,
        action: () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
        }
    },
    {
        name: 'SMS',
        icon: <Smartphone className="h-6 w-6" />,
        action: () => {
             window.open(`sms:?&body=${encodeURIComponent(shareMessage)}`, '_blank');
        }
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    toast({ title: 'Invite message copied!' });
  };

  return (
    <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
            {shareOptions.map((option) => (
                <Button
                    key={option.name}
                    variant="outline"
                    onClick={option.action}
                    className="w-full h-16 flex flex-col items-center justify-center gap-1.5"
                    aria-label={`Share on ${option.name}`}
                >
                    {option.icon}
                    <span className="text-xs">{option.name}</span>
                </Button>
            ))}
            <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full h-16 flex flex-col items-center justify-center gap-1.5"
                aria-label="Copy invite link and message"
            >
                <Copy className="h-6 w-6" />
                <span className="text-xs">Copy</span>
            </Button>
        </div>
    </div>
  );
}
