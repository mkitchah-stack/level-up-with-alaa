import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="ltr day-num text-6xl text-forest">404</p>
      <p className="text-ink-muted">هذه الصفحة غير موجودة.</p>
      <Link href="/dashboard" className="btn-primary">العودة للرئيسية</Link>
    </main>
  );
}
