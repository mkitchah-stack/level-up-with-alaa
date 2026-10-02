'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthShell, FormMessage } from '@/components/AuthShell';
import { supabaseBrowser } from '@/lib/supabase/client';
import { arAuthError } from '@/lib/authErrors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (error) setError(arAuthError(error.message)); else setDone(true);
  }

  return (
    <AuthShell title="استعادة كلمة المرور" subtitle="سنرسل لك رابطًا لتعيين كلمة مرور جديدة.">
      {done ? (
        <FormMessage kind="ok">إذا كان البريد مسجلًا لدينا، ستصلك رسالة خلال دقائق.</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <div>
            <label htmlFor="email" className="label">البريد الإلكتروني</label>
            <input id="email" type="email" dir="ltr" required className="input text-left" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={busy || !email}>{busy ? 'جارٍ الإرسال…' : 'إرسال الرابط'}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-forest underline underline-offset-4">العودة لتسجيل الدخول</Link></p>
    </AuthShell>
  );
}
