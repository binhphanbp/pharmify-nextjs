'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/stores';
import AuthModal from '@/components/shop/AuthModal';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <span className="material-icons text-4xl text-primary animate-spin">
            sync
          </span>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((s) => s.auth);
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) router.push(redirect);
  }, [user, redirect, router]);

  if (user) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-icons text-4xl text-primary">
              local_pharmacy
            </span>
            <span className="text-2xl font-bold text-primary">Pharmify</span>
          </div>
          <p className="text-text-secondary text-sm">
            Đăng nhập để mua sắm và theo dõi đơn hàng
          </p>
        </div>
        <AuthModal
          onClose={() => router.push(redirect)}
          redirectTo={redirect}
          standalone
        />
      </div>
    </div>
  );
}
