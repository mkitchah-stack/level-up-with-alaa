'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'نظرة عامة' },
  { href: '/admin/students', label: 'الطلاب' },
  { href: '/admin/payments', label: 'المدفوعات' },
  { href: '/admin/content', label: 'المحتوى والفيديوهات' },
  { href: '/admin/settings', label: 'الإعدادات والسعر' },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4" aria-label="أقسام الإدارة">
      <ul className="flex gap-1 whitespace-nowrap">
        {ITEMS.map((i) => {
          const on = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={on ? 'page' : undefined}
                className={`inline-block border-b-2 px-3 py-2.5 text-sm font-medium ${on ? 'border-gold text-white' : 'border-transparent text-white/65 hover:text-white'}`}>{i.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
