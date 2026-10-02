'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { FormMessage } from '@/components/AuthShell';

const METHODS = [
  { v: 'baridimob', l: 'BaridiMob' },
  { v: 'ccp', l: 'CCP (بريد الجزائر)' },
  { v: 'bank', l: 'تحويل بنكي' },
  { v: 'other', l: 'طريقة أخرى' },
];
const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

export function PaymentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState('baridimob');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file && !reference.trim()) return setError('أرفق صورة الوصل أو اكتب رقم العملية على الأقل.');
    if (file && file.size > MAX) return setError('حجم الملف أكبر من 5MB.');
    if (file && !TYPES.includes(file.type)) return setError('الصيغ المقبولة: JPG, PNG, WEBP, HEIC, PDF.');
    setBusy(true);
    const supabase = supabaseBrowser();
    let path: string | null = null;
    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
      path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from('payment-proofs').upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) { setBusy(false); return setError('تعذر رفع الملف. أعد المحاولة.'); }
    }
    const { error } = await supabase.from('payment_requests').insert({
      student_id: userId, payment_method: method, payment_reference: reference.trim().slice(0, 200) || null,
      screenshot_path: path, note: note.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) return setError(error.code === '23505' ? 'لديك طلب قيد المراجعة بالفعل.' : 'تعذر إرسال الطلب. أعد المحاولة.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <div>
        <label htmlFor="method" className="label">طريقة الدفع</label>
        <select id="method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ref" className="label">رقم العملية / المرجع</label>
        <input id="ref" dir="ltr" className="input text-left" maxLength={200} value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div>
        <label htmlFor="file" className="label">صورة الوصل</label>
        <input id="file" type="file" accept="image/*,application/pdf" className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:font-semibold file:text-forest"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <p className="mt-1 text-xs text-ink-muted">حتى 5MB. لا يراها إلا فريق الإدارة.</p>
      </div>
      <div>
        <label htmlFor="note" className="label">ملاحظة (اختياري)</label>
        <textarea id="note" rows={3} className="input" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
    </form>
  );
}
