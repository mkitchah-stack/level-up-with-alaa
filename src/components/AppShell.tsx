'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { Icon } from '@/components/Icon';
import { useProgress } from '@/components/ProgressProvider';

const NAV = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'home' },
  { href: '/today', label: 'مهام اليوم', icon: 'today' },
  { href: '/days', label: '132 يومًا', icon: 'grid' },
  { href: '/progress', label: 'التقدم', icon: 'chart' },
];
const MORE = [
  { href: '/catch-up', label: 'الاستدراك', icon: 'rewind' },
  { href: '/reviews', label: 'المراجعات', icon: 'pen' },
  { href: '/resources', label: 'المصادر', icon: 'book' },
  { href: '/account', label: 'حسابي', icon: 'user' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { profile, saving, error, clearError } = useProgress();
  const active = (href: string) => path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
  const moreActive = MORE.some((m) => active(m.href)) || path.startsWith('/account');

  return (
    <div className="min-h-dvh lg:flex">
      {/* desktop / tablet-landscape rail (right side in RTL) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-l border-line bg-white px-4 py-6 lg:flex">
        <Brand href="/dashboard" />
        <nav className="mt-8 flex-1 space-y-1" aria-label="التنقل الرئيسي">
          {[...NAV, ...MORE].map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium ${active(n.href) ? 'bg-forest text-white' : 'text-ink hover:bg-sand'}`}>
              <Icon name={n.icon} className="h-5 w-5" /> {n.label}
            </Link>
          ))}
          {profile.role === 'admin' && (
            <Link href="/admin" className="mt-4 flex items-center gap-3 rounded-xl border border-gold/50 px-3 py-2.5 text-[15px] font-semibold text-gold-ink hover:bg-gold-pale">
              <Icon name="shield" className="h-5 w-5" /> لوحة الإدارة
            </Link>
          )}
        </nav>
        <p className="truncate px-1 text-sm text-ink-muted">{profile.name}</p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
          <Brand href="/dashboard" />
          <div className="flex items-center gap-2">
            {profile.role === 'admin' && <Link href="/admin" className="pill !bg-gold-pale !text-gold-ink">الإدارة</Link>}
            <Link href="/account" aria-label="حسابي" className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-line text-forest">
              <Icon name="user" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* mobile + portrait tablet bottom bar */}
      <nav aria-label="التنقل السفلي" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {[...NAV, { href: '/account', label: 'المزيد', icon: 'more' }].map((n) => {
            const on = n.href === '/account' ? moreActive : active(n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={on ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? 'text-forest' : 'text-ink-muted'}`}>
                  <span className={`flex h-8 w-12 items-center justify-center rounded-full ${on ? 'bg-forest-mist' : ''}`}><Icon name={n.icon} /></span>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* save status + errors */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-6">
        {error ? (
          <button onClick={clearError} className="pointer-events-auto rounded-full bg-rose px-4 py-2 text-sm text-white shadow-card">
            {error} ✕
          </button>
        ) : saving > 0 ? (
          <span className="rounded-full bg-forest px-4 py-1.5 text-xs text-white/90 shadow-card">جارٍ الحفظ…</span>
        ) : null}
      </div>
    </div>
  );
}
