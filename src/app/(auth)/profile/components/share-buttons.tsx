'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Smartphone, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  referralCode: string;
}

interface ShareButtonProps {
  name: string;
  icon: React.ReactNode;
  action: () => void;
  className?: string;
  iconBgClassName?: string;
}

function ShareButton({ name, icon, action, className, iconBgClassName }: ShareButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={action}
            className={cn(
                'w-full h-28 flex flex-col items-center justify-center gap-2 rounded-2xl border-transparent bg-card shadow-sm transition-all hover:bg-muted',
                className
            )}
            aria-label={`Share on ${name}`}
        >
            <div className={cn("flex items-center justify-center h-14 w-14 rounded-full", iconBgClassName)}>
                {icon}
            </div>
            <span className="font-medium text-sm">{name}</span>
        </Button>
    );
}

export function ShareButtons({ referralCode }: ShareButtonsProps) {
  const { toast } = useToast();

  if (!referralCode || typeof window === 'undefined') {
    return null;
  }

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const shareMessage = `Join this CAPTCHA earning app and get 100 free coins! Use my referral code: ${referralCode}. Download here: ${referralLink}`;

  const shareOptions: ShareButtonProps[] = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-7 w-7 text-primary-foreground" />,
      action: () => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
      },
      iconBgClassName: 'bg-primary',
      className: 'hover:shadow-primary/20 hover:shadow-lg'
    },
    {
        name: 'Telegram',
        icon: <Send className="h-7 w-7 text-accent-foreground" />,
        action: () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        iconBgClassName: 'bg-accent',
        className: 'hover:shadow-accent/20 hover:shadow-lg'
    },
    {
        name: 'SMS',
        icon: <Smartphone className="h-7 w-7 text-secondary-foreground" />,
        action: () => {
             window.open(`sms:?&body=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        iconBgClassName: 'bg-secondary',
        className: 'hover:shadow-md'
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    toast({ title: 'Invite message copied!' });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
                <ShareButton key={option.name} {...option} />
            ))}
        </div>
        <Button
            variant="ghost"
            onClick={handleCopy}
            className="w-full text-muted-foreground"
            aria-label="Copy invite link and message"
        >
            <Copy className="h-4 w-4 mr-2" />
            Copy Invite Message
        </Button>
    </div>
  );
}
