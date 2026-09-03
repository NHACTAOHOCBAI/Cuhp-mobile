export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  initials: string;
  status: "online" | "offline" | "away";
  role: "admin" | "user";
  lastSeen?: string;
  created_at?: string;
  daily_target: number;
  current_streak: number;
  last_reviewed_date?: string | null;
  words_reviewed_today: number;
  last_streak_increment_date?: string | null;
  sleep_bedtime: string;
  sleep_waketime: string;
  sleep_reminder_enabled: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  expires_at: string;
  refresh_expires_at?: string;
  user: User;
}

export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation?: string | null;
  meaning: string;
  word_type?: string | null;
  notes?: string | null;
  context_sentence?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  box_number: number;
  next_review_at: string;
}

export interface VocabularyListParams {
  page?: number;
  page_size?: number;
  q?: string;
  word_type?: string;
  due?: boolean;
}

export interface VocabularyListResponse {
  items: VocabularyItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface VocabularyReviewRequest {
  known: boolean;
}

export interface VocabularyReviewResponse {
  vocabulary: VocabularyItem;
  daily_target: number;
  current_streak: number;
  words_reviewed_today: number;
}

// --- AUDIO TYPES ---
export interface AudioListItem {
  id: string;
  title: string;
  level: "easy" | "medium" | "hard";
  category: string;
  duration: number; // in seconds
  description?: string;
  created_at: string;
  has_transcript: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  level: "easy" | "medium" | "hard";
  category: string;
  duration: number;
  description?: string;
  transcript: string;
  translation?: string;
  created_at: string;
}

export interface AudioComment {
  id: string;
  audio_id: string;
  user_id: string;
  user_name: string;
  content: string;
  selected_text?: string | null;
  created_at: string;
}

export interface AudioListResponse {
  items: AudioListItem[];
  total: number;
  page: number;
  page_size: number;
}

// --- READING TYPES ---
export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  translation: string;
  level: "easy" | "medium" | "hard";
  category: string;
  image_url?: string;
  created_at: string;
}

export interface ReadingPassageListResponse {
  items: ReadingPassage[];
  total: number;
  page: number;
  page_size: number;
}

export interface TranslationPractice {
  id: string;
  user_id: string;
  passage_id: string;
  user_translation: string;
  updated_at: string;
}

export interface ReadingComment {
  id: string;
  passage_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

// --- TODO TYPES ---
export type TodoQuadrant = "inbox" | "do" | "schedule" | "delegate" | "eliminate";

export interface TodoTask {
  id: string;
  user_id: string;
  title: string;
  quadrant: TodoQuadrant;
  due_date?: string | null; // YYYY-MM-DD
  scheduled_date?: string | null; // YYYY-MM-DD
  estimated_time?: number | null; // minutes
  actual_time?: number | null; // minutes
  completed: boolean;
  completed_at?: string | null;
  position: number;
  created_at: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  by_quadrant: {
    do: number;
    schedule: number;
    delegate: number;
    eliminate: number;
    inbox: number;
  };
  completion_rate: number;
}

// --- GYM TYPES ---
export interface WorkoutCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  user_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  sets: number;
  reps: number;
  weight?: number | null; // kg
  category_id?: string | null;
  completed: boolean;
  created_at: string;
}

export interface GymStats {
  weekly_volume: Array<{
    date: string;
    volume: number;
  }>;
  exercise_progress: Array<{
    exercise_name: string;
    history: Array<{
      date: string;
      max_weight: number;
      volume: number;
    }>;
  }>;
}

// --- SLEEP TYPES ---
export interface SleepLog {
  id: string;
  user_id: string;
  sleep_date: string; // YYYY-MM-DD
  sleep_time_actual: string; // ISO String
  wake_time_actual: string; // ISO String
  duration_minutes: number;
  notes?: string | null;
  created_at: string;
}

export interface SleepStats {
  average_duration_hours: number;
  average_bedtime: string; // "HH:MM"
  average_waketime: string; // "HH:MM"
  sleep_logs_7_days: SleepLog[];
}


