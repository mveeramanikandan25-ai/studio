'use client';
import AuthGuard from '@/components/auth/auth-guard';
import { BottomNav } from '@/components/layout/bottom-nav';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const WelcomeDialog = dynamic(() => import('@/components/ui/welcome-dialog').then(mod => mod.WelcomeDialog), {
  ssr: false,
});

const PUBLIC_PATHS = ['/terms', '/privacy', '/about'];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (isPublicPath) {
    // A simple layout for public static pages
    return (
        <div className="relative flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-lg">
                <div className="container mx-auto flex h-16 max-w-md items-center">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
                        <ArrowLeft className="h-6 w-6" />
                        <span>Back</span>
                    </Link>
                </div>
            </header>
            <main className="flex-1">
              <div className="container mx-auto max-w-md px-4 py-6">{children}</div>
            </main>
        </div>
    );
  }

  // The original layout for authenticated pages
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
