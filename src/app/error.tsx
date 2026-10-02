'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xl font-bold text-forest">تعذر تحميل الصفحة</p>
      <p className="text-ink-muted">تحقق من الاتصال بالإنترنت ثم أعد المحاولة.</p>
      <button onClick={reset} className="btn-primary">إعادة المحاولة</button>
    </main>
  );
}
