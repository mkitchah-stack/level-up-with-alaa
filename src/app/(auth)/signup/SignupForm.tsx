'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { arAuthError } from '@/lib/authErrors';
import { FormMessage } from '@/components/AuthShell';

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('اكتب اسمك (حرفان على الأقل).');
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    if (password !== password2) return setError('كلمتا المرور غير متطابقتين.');
    setBusy(true);
    const origin = window.location.origin;
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim().slice(0, 120) }, emailRedirectTo: `${origin}/auth/callback?next=/pending` },
    });
    setBusy(false);
    if (error) return setError(arAuthError(error.message));
    if (data.session) { router.replace('/pending'); router.refresh(); return; } // email confirmation disabled
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <div className="space-y-3">
        <FormMessage kind="ok">أرسلنا رابط التأكيد إلى <span className="ltr font-semibold">{sentTo}</span>. افتحه ثم سجّل الدخول.</FormMessage>
        <p className="text-sm text-ink-muted">لم تصلك الرسالة؟ تحقق من مجلد Spam، أو انتظر دقيقة ثم أعد التسجيل بنفس البريد.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <div>
        <label htmlFor="name" className="label">الاسم الكامل</label>
        <input id="name" autoComplete="name" required maxLength={120} className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="email" className="label">البريد الإلكتروني</label>
        <input id="email" type="email" autoComplete="email" inputMode="email" dir="ltr" required className="input text-left"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="label">كلمة المرور</label>
        <input id="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required className="input text-left"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="mt-1 text-xs text-ink-muted">8 أحرف على الأقل.</p>
      </div>
      <div>
        <label htmlFor="password2" className="label">تأكيد كلمة المرور</label>
        <input id="password2" type="password" autoComplete="new-password" dir="ltr" required className="input text-left"
          value={password2} onChange={(e) => setPassword2(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب'}</button>
    </form>
  );
}
