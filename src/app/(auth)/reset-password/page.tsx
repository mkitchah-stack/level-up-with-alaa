'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell, FormMessage } from '@/components/AuthShell';
import { supabaseBrowser } from '@/lib/supabase/client';
import { arAuthError } from '@/lib/authErrors';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(arAuthError(error.message));
    router.replace('/dashboard'); router.refresh();
  }

  return (
    <AuthShell title="كلمة مرور جديدة">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <div>
          <label htmlFor="pw" className="label">كلمة المرور الجديدة</label>
          <input id="pw" type="password" autoComplete="new-password" dir="ltr" className="input text-left" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}</button>
      </form>
    </AuthShell>
  );
}
