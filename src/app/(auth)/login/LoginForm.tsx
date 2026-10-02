'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { arAuthError, safeNext } from '@/lib/authErrors';
import { FormMessage } from '@/components/AuthShell';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get('error') ? 'انتهت صلاحية الرابط أو أنه غير صالح. سجّل الدخول من جديد.' : null);
  const confirmed = params.get('confirmed') === '1';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setError(arAuthError(error.message)); setBusy(false); return; }
    router.replace(safeNext(params.get('next')));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {confirmed && <FormMessage kind="ok">تم تأكيد بريدك. سجّل الدخول الآن.</FormMessage>}
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <div>
        <label htmlFor="email" className="label">البريد الإلكتروني</label>
        <input id="email" type="email" autoComplete="email" inputMode="email" dir="ltr" required className="input text-left"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">كلمة المرور</label>
          <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-gold-ink underline underline-offset-4">نسيت كلمة المرور؟</Link>
        </div>
        <input id="password" type="password" autoComplete="current-password" dir="ltr" required className="input text-left"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy || !email || !password}>
        {busy ? 'جارٍ الدخول…' : 'دخول'}
      </button>
    </form>
  );
}
