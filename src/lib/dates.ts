import { isoDateInZone } from '@/lib/programLogic';
export const TZ = 'Africa/Algiers';
export const todayIso = () => isoDateInZone(new Date(), TZ);

export function formatArDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}
export function formatArDateTime(ts: string | null | undefined) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(ts));
}
export const pad3 = (n: number) => String(n).padStart(3, '0');
