import Link from 'next/link';
import { requireAdmin } from '@/lib/data';
import { Brand } from '@/components/Brand';
import { SignOutButton } from '@/components/SignOutButton';
import { AdminNav } from './AdminNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: { default: 'لوحة الإدارة', template: '%s · الإدارة' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="bg-forest-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3"><Brand light href="/admin" /><span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-forest-deep">الإدارة</span></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-white/70 sm:inline">{profile.name}</span>
            <Link href="/dashboard" className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10">واجهة الطالب</Link>
            <SignOutButton className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10" />
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
