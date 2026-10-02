import { getSession } from '@/lib/data';
import { StudentsTable, type StudentRow } from './StudentsTable';

export const metadata = { title: 'الطلاب' };

export default async function StudentsPage() {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc('admin_student_overview');
  if (error) return <p className="text-rose">تعذر تحميل الطلاب: {error.message}</p>;
  return <StudentsTable rows={(data ?? []) as StudentRow[]} />;
}
