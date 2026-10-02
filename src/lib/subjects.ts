// Display labels keyed by the `subject` code from the approved JSON.
// The DB column subject_label_ar keeps the original seed text untouched; it was
// extracted from the PDF text layer and has broken lam-alef ligatures
// (e.g. "الدراسات االجتماعية"), so the UI shows these clean labels instead.
export const SUBJECTS: Record<string, { label: string; short: string; color: string }> = {
  social_studies: { label: 'الدراسات الاجتماعية', short: 'اجتماعيات', color: '#1F4A3E' },
  arabic: { label: 'اللغة العربية', short: 'عربية', color: '#7E5F1D' },
  english: { label: 'English', short: 'English', color: '#3D5A80' },
  sharia: { label: 'الشريعة الإسلامية', short: 'شريعة', color: '#6B4E71' },
  memorization: { label: 'الحفظ اليومي', short: 'حفظ', color: '#B5655A' },
};
export const SUBJECT_ORDER = ['social_studies', 'arabic', 'english', 'sharia', 'memorization'];

export function subjectLabel(code: string | null | undefined, fallback?: string | null) {
  if (code && SUBJECTS[code]) return SUBJECTS[code].label;
  return fallback || 'مهمة';
}
export function subjectColor(code: string | null | undefined) {
  return (code && SUBJECTS[code]?.color) || '#1F4A3E';
}

export const MONTH_NAMES = ['الشهر الأول', 'الشهر الثاني', 'الشهر الثالث', 'الشهر الرابع'];
