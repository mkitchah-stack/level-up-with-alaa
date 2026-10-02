import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { SignupForm } from './SignupForm';

export const metadata = { title: 'إنشاء حساب' };

export default function SignupPage() {
  return (
    <AuthShell title="إنشاء حساب" subtitle="حساب واحد لكل طالب، وتقدمك محفوظ دائمًا.">
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        لديك حساب؟ <Link href="/login" className="font-semibold text-forest underline underline-offset-4">تسجيل الدخول</Link>
      </p>
    </AuthShell>
  );
}
