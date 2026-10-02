// Arabic number agreement for the counts shown to students.
export function arCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 0) return `0 ${many}`;
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}
export const tasksAr = (n: number) => arCount(n, 'مهمة واحدة', 'مهمتان', 'مهام', 'مهمة');
export const daysAr = (n: number) => arCount(n, 'يوم واحد', 'يومان', 'أيام', 'يومًا');
