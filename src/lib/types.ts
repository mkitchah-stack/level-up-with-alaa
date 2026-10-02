export type Resource = { title: string; url: string; type?: string };

export type Task = {
  id: string;
  day_number: number;
  task_number: number;
  subject: string | null;
  subject_label_ar: string | null;
  task_type: string | null;
  title: string;
  description: string | null;
  has_video: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  resources: Resource[];
  /** checklist texts in item_index order — the shape programLogic expects */
  checklist_items: string[];
};

export type Day = { day: number; month: number; tasks: Task[] };

export type WeeklyReview = { week_number: number; from_day: number; to_day: number; max_stars: number | null };
export type MonthlyReview = { month_number: number; from_day: number; to_day: number; max_stars: number | null };
export type FinalMetric = { label: string; value: number; target: number };

export type Program = {
  days: Record<number, Day>;
  dayNumbers: number[];
  weekly: WeeklyReview[];
  monthly: MonthlyReview[];
  finalCheck: FinalMetric[];
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  account_status: 'pending' | 'active' | 'suspended';
  program_start_date: string | null;
  created_at: string;
};

export type TaskRow = { task_id: string; completed: boolean; completed_at: string | null };
export type ChecklistRow = { checklist_item_id: string; completed: boolean; completed_at: string | null };
