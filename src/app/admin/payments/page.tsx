import { getSession, loadSettings } from '@/lib/data';
import { PaymentsList, type PaymentRow } from './PaymentsList';

export const metadata = { title: 'المدفوعات' };

export default async function PaymentsPage() {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from('payment_requests')
    .select('id,student_id,payment_method,payment_reference,screenshot_path,note,status,submitted_at,reviewed_at,admin_note,profiles(name,email,account_status)')
    .order('submitted_at', { ascending: false })
    .limit(300);
  if (error) return <p className="text-rose">تعذر تحميل الطلبات: {error.message}</p>;

  // short-lived signed URLs, created with the admin's own session (Storage RLS allows admins to read)
  const paths = (data ?? []).map((r) => r.screenshot_path).filter(Boolean) as string[];
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data: urls } = await supabase.storage.from('payment-proofs').createSignedUrls(paths, 60 * 15);
    (urls ?? []).forEach((u) => { if (u.path && u.signedUrl) signed[u.path] = u.signedUrl; });
  }
  const settings = await loadSettings();
  const rows = (data ?? []).map((r) => ({
    ...r,
    profile: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
    proof_url: r.screenshot_path ? signed[r.screenshot_path] ?? null : null,
  })) as unknown as PaymentRow[];
  return <PaymentsList rows={rows} price={settings.price} currency={settings.currency} />;
}
