import Link from 'next/link';
import { getSession } from '@/lib/data';
import { Stat } from '@/components/ui';

export default async function AdminHome() {
  const { supabase } = await getSession();
  const count = async (status: string) =>
    (await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('account_status', status)).count ?? 0;
  const [active, pending, suspended, payPending, videos, tasks] = await Promise.all([
    count('active'), count('pending'), count('suspended'),
    supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').then((r) => r.count ?? 0),
    supabase.from('program_tasks').select('id', { count: 'exact', head: true }).not('video_url', 'is', null).then((r) => r.count ?? 0),
    supabase.from('program_tasks').select('id', { count: 'exact', head: true }).eq('has_video', true).then((r) => r.count ?? 0),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-forest">نظرة عامة</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="طلاب مفعّلون" value={active} />
        <Stat label="في انتظار التفعيل" value={pending} />
        <Stat label="موقوفون" value={suspended} />
        <Link href="/admin/payments"><Stat label="طلبات دفع جديدة" value={payPending} sub="مراجعة ←" /></Link>
      </div>
      <div className="card p-5">
        <p className="font-bold text-forest">روابط الفيديو</p>
        <p className="mt-1 text-[15px] text-ink-muted">{videos} مهمة لها رابط فيديو · {tasks} مهمة معلَّمة في البلانر بأن لها فيديو.</p>
        <Link href="/admin/content" className="btn-ghost btn-sm mt-3">إضافة الروابط</Link>
      </div>
    </div>
  );
}
