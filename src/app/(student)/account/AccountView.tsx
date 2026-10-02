'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/components/ProgressProvider';
import { Icon } from '@/components/Icon';
import { PageTitle } from '@/components/ui';
import { SignOutButton } from '@/components/SignOutButton';
import { supabaseBrowser } from '@/lib/supabase/client';
import { formatArDate } from '@/lib/dates';

const LINKS = [
  { href: '/catch-up', label: 'استدراك الفائت', icon: 'rewind' },
  { href: '/reviews', label: 'المراجعات الأسبوعية والشهرية', icon: 'pen' },
  { href: '/reviews/final', label: 'التحقق النهائي', icon: 'check' },
  { href: '/resources', label: 'المصادر والفيديوهات', icon: 'book' },
];

export function AccountView() {
  const { profile } = useProgress();
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim().slice(0, 120);
    if (v.length < 2) return setMsg('الاسم قصير جدًا.');
    const { error } = await supabaseBrowser().from('profiles').update({ name: v }).eq('id', profile.id);
    setMsg(error ? 'تعذر الحفظ.' : 'تم حفظ الاسم.');
    if (!error) router.refresh();
  }

  return (
    <div className="space-y-5">
      <PageTitle title="حسابي" />
      <nav className="card divide-y divide-line">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between px-5 py-4 hover:bg-sand/60">
            <span className="flex items-center gap-3 text-[15px] text-forest"><Icon name={l.icon} className="h-5 w-5 text-gold" />{l.label}</span>
            <Icon name="chevron" className="h-4 w-4 text-ink-muted" />
          </Link>
        ))}
        {profile.role === 'admin' && (
          <Link href="/admin" className="flex items-center justify-between px-5 py-4 hover:bg-gold-pale">
            <span className="flex items-center gap-3 font-semibold text-gold-ink"><Icon name="shield" className="h-5 w-5" />لوحة الإدارة</span>
            <Icon name="chevron" className="h-4 w-4 text-ink-muted" />
          </Link>
        )}
      </nav>

      <form onSubmit={saveName} className="card space-y-3 p-5">
        <label htmlFor="name" className="label">الاسم</label>
        <input id="name" className="input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center gap-3"><button className="btn-primary btn-sm">حفظ</button>{msg && <span className="text-sm text-ink-muted">{msg}</span>}</div>
      </form>

      <div className="card space-y-1 p-5 text-[15px]">
        <p><span className="text-ink-muted">البريد: </span><span className="ltr">{profile.email}</span></p>
        <p><span className="text-ink-muted">بداية البرنامج: </span>{profile.program_start_date ? formatArDate(profile.program_start_date) : 'لم تُحدَّد بعد'}</p>
      </div>

      <SignOutButton className="btn-ghost w-full" />
    </div>
  );
}
