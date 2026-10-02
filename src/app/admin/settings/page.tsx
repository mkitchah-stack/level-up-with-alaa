import { loadSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'الإعدادات' };

export default async function SettingsPage() {
  const s = await loadSettings();
  return <SettingsForm initial={s} />;
}
