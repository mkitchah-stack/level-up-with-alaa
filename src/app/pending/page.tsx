import { redirect } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { SignOutButton } from '@/components/SignOutButton';
import { getSession, loadSettings } from '@/lib/data';
import { formatArDateTime } from '@/lib/dates';
import { PaymentForm } from './PaymentForm';

export const metadata = { title: 'تفعيل الحساب' };
export const dynamic = 'force-dynamic';

const STATUS_AR: Record<string, string> = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' };

export default async function PendingPage() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile && (profile.account_status === 'active' || profile.role === 'admin')) redirect('/dashboard');

  const settings = await loadSettings();
  const { data: requests } = await supabase
    .from('payment_requests')
    .select('id,payment_method,payment_reference,status,submitted_at,reviewed_at,admin_note')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false });
  const hasPending = (requests ?? []).some((r) => r.status === 'pending');
  const suspended = profile?.account_status === 'suspended';

  return (
    <main className="min-h-dvh">
      <header className="bg-forest px-5 pb-14 pt-6 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Brand light />
          <SignOutButton className="rounded-full border border-white/25 px-3.5 py-1.5 text-sm text-white hover:bg-white/10 inline-flex items-center gap-2" />
        </div>
      </header>
      <div className="-mt-8 px-4 pb-16">
        <div className="mx-auto max-w-2xl space-y-4">
          <section className="card p-6">
            <h1 className="text-2xl font-bold text-forest">أهلًا {profile?.name || ''} 🤍</h1>
            {suspended ? (
              <p className="mt-2 text-ink-muted">حسابك موقوف حاليًا. تواصل معنا لإعادة تفعيله{settings.contact ? `: ${settings.contact}` : '.'}</p>
            ) : (
              <p className="mt-2 text-ink-muted">
                حسابك جاهز. لفتح البرنامج الكامل (132 يومًا) أرسل إثبات الدفع، وسيتم تفعيل حسابك بعد المراجعة.
              </p>
            )}
          </section>

          {!suspended && (
            <section className="card p-6">
              <h2 className="text-lg font-bold text-forest">الاشتراك</h2>
              <p className="mt-3 day-num text-4xl text-forest">
                {settings.price !== null ? <><span className="ltr">{settings.price.toLocaleString('fr-DZ')}</span> <span className="text-xl text-gold-ink">{settings.currency === 'DZD' ? 'دج' : settings.currency}</span></> : <span className="font-sans text-base font-normal text-ink-muted">سيُعلن السعر قريبًا.</span>}
              </p>
              {settings.instructions && (
                <div className="mt-4 whitespace-pre-line rounded-xl bg-sand p-4 text-[15px] text-ink">{settings.instructions}</div>
              )}
              {settings.contact && <p className="mt-3 text-sm text-ink-muted">للاستفسار: <span className="ltr">{settings.contact}</span></p>}
            </section>
          )}

          {!suspended && (hasPending ? (
            <section className="card-sand p-6">
              <h2 className="font-bold text-forest">تم استلام طلبك ✓</h2>
              <p className="mt-1 text-[15px] text-ink-muted">طلبك قيد المراجعة. سيتفعّل حسابك تلقائيًا بعد قبوله — أعد فتح هذه الصفحة لاحقًا.</p>
            </section>
          ) : (
            <section className="card p-6">
              <h2 className="text-lg font-bold text-forest">إرسال إثبات الدفع</h2>
              <PaymentForm userId={user.id} />
            </section>
          ))}

          {(requests ?? []).length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold text-forest">طلباتك</h2>
              <ul className="mt-3 divide-y divide-line">
                {requests!.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>{formatArDateTime(r.submitted_at)} — {r.payment_method || '—'}</span>
                    <span className={`pill ${r.status === 'approved' ? '!bg-forest-mist !text-forest' : r.status === 'rejected' ? '!bg-rose-pale !text-rose' : ''}`}>{STATUS_AR[r.status]}</span>
                    {r.admin_note && <p className="w-full text-ink-muted">ملاحظة: {r.admin_note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
