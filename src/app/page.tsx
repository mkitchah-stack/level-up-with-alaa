import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { Icon } from '@/components/Icon';

// Copy taken from the approved planner's cover and "START HERE" pages.
const SUBJECTS = [
  'دروس التاريخ', 'دروس الجغرافيا', 'مصطلحات التاريخ', 'الشخصيات التاريخية', 'التواريخ',
  'مصطلحات الجغرافيا', 'دروس الشريعة', 'دروس اللغة العربية', 'دروس اللغة الإنجليزية',
];

const STEPS = [
  { t: 'افتح المنصة', d: 'لا تحتاج أن تسأل كل يوم: ماذا أدرس؟' },
  { t: 'انظر إلى مهام اليوم', d: 'ثلاث مهام واضحة: درس، حفظ، مراجعة أو تطبيق بكالوريا.' },
  { t: 'أنجزها', d: 'علّم كل خطوة عند إتمامها، وتُحفظ مباشرة في حسابك.' },
  { t: 'تابع النجوم وواصل', d: 'كل مهمة مكتملة نجمة، وسلسلة الإنجاز تكبر يومًا بعد يوم.' },
];

export default function Landing() {
  return (
    <main>
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-5 sm:px-8">
          <Brand light />
          <Link href="/login" className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10">تسجيل الدخول</Link>
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-24 sm:pt-20">
          <p className="ltr font-display text-sm font-semibold tracking-[0.4em] text-gold">PREMIUM STUDY PLANNER</p>
          <h1 className="mx-auto mt-5 max-w-2xl text-[28px] font-bold leading-snug sm:text-[40px]">
            خطة 132 يومًا لإتمام مقرر المواد الثانوية
          </h1>
          <div className="ltr mt-8 font-display leading-none">
            <div className="text-[38px] font-bold tracking-[0.04em] sm:text-[64px]">LEVEL UP WITH ALAA</div>
            <div className="mt-2 text-[34px] font-bold text-gold sm:text-[56px]">BAC 2027</div>
          </div>
          <ul className="mx-auto mt-9 flex max-w-2xl flex-wrap justify-center gap-2">
            {SUBJECTS.map((s) => (
              <li key={s} className="rounded-full border border-gold/50 px-3.5 py-1 text-[13px] text-white/90">{s}</li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-gold w-full max-w-xs sm:w-auto">إنشاء حساب</Link>
            <Link href="/login" className="btn w-full max-w-xs border border-white/30 text-white hover:bg-white/10 sm:w-auto">لدي حساب</Link>
          </div>
          <p className="mt-10 text-sm text-white/70">من إعداد <span className="ltr font-display text-base font-bold text-white">Dr. Alaa</span></p>
        </div>
        <div aria-hidden className="ltr absolute -bottom-10 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[160px] font-bold leading-none text-white/[0.04] sm:text-[260px]">132</div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-bold text-forest">لماذا هذا البلانر؟</h2>
        <p className="mt-4 text-[16px] text-ink/85">
          أنا Alaa، طالبة طب في السنة الثالثة، حاصلة على بكالوريا 2024 بمعدل 16.99. لاحظت أن الكثير من الطلاب يتابعون دروس الدعم
          في المواد الأساسية، بينما تبقى المواد الثانوية بلا خطة واضحة فتتراكم. الهدف ليس أن يدرس البلانر مكانك، بل أن يتولى عنك
          التخطيط والتنظيم حتى تعرف ماذا تفعل، ومتى تراجع، وكيف تتقدم دون عشوائية.
        </p>
        <blockquote className="mt-6 border-r-4 border-gold bg-sand px-5 py-4 text-forest">
          مثلما سلّمت فهمك ومتابعتك لدروسك لأستاذ الدعم، سلّم تنظيمك في المواد الثانوية لهذا البلانر 🤍
        </blockquote>
      </section>

      <section className="bg-sand/70">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <h2 className="text-2xl font-bold text-forest">كيف يعمل؟</h2>
          <ol className="mt-6 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-2xl bg-white p-4 border border-line">
                <span className="day-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-lg text-gold">{i + 1}</span>
                <div>
                  <p className="font-bold text-forest">{s.t}</p>
                  <p className="text-[15px] text-ink-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { i: 'star', t: 'نظام النجوم', d: 'نجمة لكل مهمة مكتملة — 396 نجمة في المجموع.' },
              { i: 'rewind', t: 'استدراك الفائت', d: 'المهام التي فاتتك لا تختفي، تجدها في قسم Catch-up.' },
              { i: 'pen', t: 'مراجعة أسبوعية وشهرية', d: 'لتعرف ماذا أنجزت وما الذي تبقّى عليك.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-line bg-white p-4">
                <Icon name={f.i} className="h-6 w-6 text-gold" />
                <p className="mt-2 font-bold text-forest">{f.t}</p>
                <p className="text-sm text-ink-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-8">
        <p className="ltr font-display text-2xl font-bold text-forest">LEVEL UP, ONE DAY AT A TIME</p>
        <Link href="/signup" className="btn-primary mt-6">ابدأ رحلتك الآن</Link>
        <p className="mt-10 text-xs text-ink-muted">© {new Date().getFullYear()} LEVEL UP WITH ALAA — BAC 2027</p>
      </section>
    </main>
  );
}
