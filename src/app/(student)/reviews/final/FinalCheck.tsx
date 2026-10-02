'use client';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { Bar, PageTitle } from '@/components/ui';
import { SUBJECT_ORDER, subjectLabel } from '@/lib/subjects';

// Labels from the approved JSON (final_check.metrics) with their Arabic meaning.
const METRIC_AR: Record<string, string> = {
  'SS sessions': 'حصص الدراسات الاجتماعية',
  'Sharia internal days': 'أيام الشريعة (الدروس)',
  'Arabic topics': 'مواضيع اللغة العربية',
  'English tasks': 'مهام اللغة الإنجليزية',
  'SS BAC-practice days': 'أيام تطبيق بكالوريا — اجتماعيات',
  'Sharia BAC-practice days': 'أيام تطبيق بكالوريا — شريعة',
  'Arabic BAC-practice days': 'أيام تطبيق بكالوريا — عربية',
  'English BAC-practice days': 'أيام تطبيق بكالوريا — إنجليزية',
};

const ORDER = Object.keys(METRIC_AR);

export function FinalCheck() {
  const { program } = useProgress();
  const s = useStats();
  const allDone = s.overall.done === s.overall.total;

  return (
    <div className="space-y-5">
      <PageTitle title="FINAL CHECK — التحقق النهائي" back={{ href: '/reviews', label: 'المراجعات' }} />

      <section className={`rounded-card p-6 ${allDone ? 'bg-forest text-white' : 'card'}`}>
        <p className={`text-sm ${allDone ? 'text-white/70' : 'text-ink-muted'}`}>حصيلتك في البرنامج</p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div><p className="ltr day-num text-4xl">{s.completedDays}<span className="text-lg opacity-60">/132</span></p><p className="text-xs opacity-70">يوم مكتمل</p></div>
          <div><p className="ltr day-num text-4xl text-gold">{s.stars.earned}<span className="text-lg opacity-60">/{s.stars.max}</span></p><p className="text-xs opacity-70">نجمة</p></div>
          <div><p className="ltr day-num text-4xl">{s.overall.pct}%</p><p className="text-xs opacity-70">التقدم</p></div>
        </div>
        {allDone && <p className="mt-4 text-center font-semibold text-gold">أتممت البرنامج كاملًا. LEVEL UP 🤍</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-forest">إتمام المواد</h2>
        <ul className="mt-3 space-y-3">
          {SUBJECT_ORDER.filter((k) => s.subjects[k]).map((k) => (
            <li key={k}>
              <div className="mb-1 flex justify-between text-sm"><span>{s.subjects[k].done === s.subjects[k].total ? '✓ ' : ''}{subjectLabel(k)}</span><span className="ltr">{s.subjects[k].done}/{s.subjects[k].total}</span></div>
              <Bar value={s.subjects[k].done} max={s.subjects[k].total} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-forest">التحقق من محتوى البرنامج</h2>
        <p className="mt-1 text-sm text-ink-muted">كما ورد في البلانر: تم الحفاظ على جميع المهام الأصلية دون حذف أو دمج أو اختراع.</p>
        <ul className="mt-3 divide-y divide-line">
          <li className="flex justify-between py-2.5 text-[15px]"><span>✓ مجموع الأيام</span><span className="ltr font-semibold">{program.dayNumbers.length}</span></li>
          {[...program.finalCheck].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label)).map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
              <span>{m.value >= m.target ? '✓' : '•'} {METRIC_AR[m.label] ?? m.label}</span>
              <span className="ltr shrink-0 font-semibold">{m.value} / {m.target}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
