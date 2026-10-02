'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

type S = { price: number | null; currency: string; instructions: string; contact: string };

export function SettingsForm({ initial }: { initial: S }) {
  const router = useRouter();
  const [price, setPrice] = useState(initial.price?.toString() ?? '');
  const [currency, setCurrency] = useState(initial.currency);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [contact, setContact] = useState(initial.contact);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = price.trim() === '' ? null : Number(price);
    if (p !== null && (!Number.isFinite(p) || p < 0)) return setMsg({ ok: false, t: 'السعر غير صالح.' });
    setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().from('app_settings').upsert([
      { key: 'subscription_price', value: p },
      { key: 'currency', value: currency.trim().slice(0, 10) || 'DZD' },
      { key: 'payment_instructions', value: instructions.slice(0, 3000) },
      { key: 'contact', value: contact.trim().slice(0, 200) },
    ], { onConflict: 'key' });
    setBusy(false);
    setMsg(error ? { ok: false, t: error.message } : { ok: true, t: 'تم الحفظ.' });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-forest">الإعدادات والسعر</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="price" className="label">سعر الاشتراك</label>
          <input id="price" inputMode="decimal" dir="ltr" className="input text-left" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="مثال: 2500" /></div>
        <div><label htmlFor="cur" className="label">العملة</label>
          <input id="cur" dir="ltr" className="input text-left" value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
      </div>
      <div><label htmlFor="ins" className="label">تعليمات الدفع (تظهر للطالب)</label>
        <textarea id="ins" rows={6} className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)}
          placeholder={'مثال:\nBaridiMob RIP: ...\nCCP: ... clé ...\nالاسم: ...'} /></div>
      <div><label htmlFor="contact" className="label">وسيلة التواصل (واتساب / إنستغرام / بريد)</label>
        <input id="contact" className="input" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-forest' : 'text-rose'}`}>{msg.t}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}</button>
    </form>
  );
}
