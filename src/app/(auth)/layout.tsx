import AuthGuard from '@/components/auth/auth-guard';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col bg-background">
        <main className="flex-1 pb-20">
          <div className="container mx-auto max-w-md px-4 pt-6">{children}</div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
