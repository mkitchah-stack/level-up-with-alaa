import { Suspense } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'تسجيل الدخول' };

export default function LoginPage() {
  return (
    <AuthShell title="تسجيل الدخول" subtitle="أكمل من حيث توقفت.">
      <Suspense><LoginForm /></Suspense>
      <p className="mt-6 text-center text-sm text-ink-muted">
        ليس لديك حساب؟ <Link href="/signup" className="font-semibold text-forest underline underline-offset-4">إنشاء حساب</Link>
      </p>
    </AuthShell>
  );
}
