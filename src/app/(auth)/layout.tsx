'use client';
import AuthGuard from '@/components/auth/auth-guard';
import { BottomNav } from '@/components/layout/bottom-nav';
import dynamic from 'next/dynamic';

const WelcomeDialog = dynamic(() => import('@/components/ui/welcome-dialog').then(mod => mod.WelcomeDialog), {
  ssr: false,
});


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WelcomeDialog />
      <div className="relative flex min-h-screen flex-col bg-background">
        <main className="flex-1 pb-20">
          <div className="container mx-auto max-w-md px-4 pt-6">{children}</div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
