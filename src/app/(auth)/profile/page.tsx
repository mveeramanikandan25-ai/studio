import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProfileClient } from './components/profile-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Shield,
  FileText,
  Info,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { APP_CONTACT_EMAIL } from '@/lib/constants';

export const metadata = {
  title: 'Profile | CASHCHA',
};

const menuItems = [
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
    { href: '/terms', label: 'Terms & Conditions', icon: FileText },
    { href: '/about', label: 'About Us', icon: Info },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <ProfileClient />

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Language</span>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
            <div className="flex flex-col">
            {menuItems.map((item, index) => (
                <React.Fragment key={item.href}>
                    <Link href={item.href} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                    </Link>
                    {index < menuItems.length -1 && <Separator />}
                </React.Fragment>
            ))}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-2">
            <a href={`mailto:${APP_CONTACT_EMAIL}`} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p>Contact Us</p>
                    <p className="text-sm text-muted-foreground">{APP_CONTACT_EMAIL}</p>
                </div>
            </a>
        </CardContent>
      </Card>
    </div>
  );
}
