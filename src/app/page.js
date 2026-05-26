'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-surface">
      <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
