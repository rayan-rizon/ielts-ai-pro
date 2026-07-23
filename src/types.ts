export interface UserProfile {
  id?: string;
  auth_id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  subscription_tier?: 'free' | 'pro' | 'premium';
  avatar_url?: string;
  created_at?: string;
  last_login?: string;
  last_active?: string;
  onboarding_completed?: boolean;
  weak_area?: string;
  study_hours_goal?: number;
  study_availability?: {
    version: 1;
    timezone: string;
    days: Partial<
      Record<
        'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
        number
      >
    >;
  } | null;
  target_band_score?: number;
  test_date?: string | null;
  [key: string]: any; // specific fields
}

export type QuestionType =
  | 'multiple_choice'
  | 'gap_fill'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'notes_completion'
  | 'flow_chart_completion'
  | 'diagram_completion'
  | 'short_answer'
  | 'table_completion'
  | 'matching_headings'
  | 'matching_features'
  | 'matching'
  | 'map_labeling'
  | 'flowchart'
  | 'diagram_label_completion'
  | 'writing_prompt'
  | 'speaking_prompt';

// Paraphrase Detective — Explanation Data Types
export interface SynonymMapEntry {
  question_keyword: string;
  passage_keyword: string;
  connection: string;
}

export interface BlankExplanation {
  passage_highlight?: string;
  synonym_map?: SynonymMapEntry[];
  why_correct?: string;
}

export interface ExplanationData {
  passage_highlight?: string;
  synonym_map?: SynonymMapEntry[];
  why_correct?: string;
  why_wrong?: Record<string, string>;
  blanks?: Record<string, BlankExplanation>;
}

export interface Question {
  id?: string;
  type: QuestionType;
  question_text?: string;
  text?: string;
  question_number?: string | number;
  question_count?: number | string;
  options?: string[];
  correct_answer?: string;
  allow_multiple?: boolean;
  gap_fill?: {
    question_count?: string | number;
    text?: string;
    content?: string;
    gap_count?: number;
    structured_text?: string;
  };
  table_data?: {
    blanks?: any[];
    blank_positions?: any[];
    blanks_count?: number;
    table_rows?: any[];
    rows?: any[];
  };
  matching_data?: {
    paragraphs?: any[];
  };
  matching_features?: {
    mode?: string;
    questions?: any[];
    answers?: Record<string, any>;
  };
  flowchart?: {
    box_title?: string;
    answer_mode?: 'input' | 'dropdown';
    steps?: { id?: string; text: string; gap_numbers?: number[] }[];
    options?: string[];
    answers?: Record<string | number, string>;
  };
  map_labeling?: {
    questions?: any[];
    items?: any[];
  };
  passage_id?: string;
  section?: number;
  explanation_data?: ExplanationData | null;
  [key: string]: any;
}

export interface Passage {
  id: string;
  title: string;
  test_type?: string;
  test_format?: string;
  topic?: string;
  content?: string;
  is_official_cambridge?: boolean;
  cambridge_year?: number;
  cambridge_test_number?: number;
  access_tier?: string;
  audio_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TestData {
  id?: string;
  title: string;
  test_type: 'reading' | 'listening' | 'writing' | 'speaking';
  test_format?: string;
  topic?: string;
  content?: string;
  is_official_cambridge?: boolean;
  cambridge_year?: number;
  cambridge_test_number?: number;
  access_tier?: string;
  audio_url?: string;
  is_active?: boolean;
  isDraft?: boolean;

  // Reading specific
  passage?: Passage;
  questions?: Question[];

  // Listening specific
  listening_sections?: {
    questions: Question[];
    [key: string]: any;
  }[];

  // Writing specific
  writing_tasks?: {
    prompt: string;
    [key: string]: any;
  }[];

  // Speaking specific
  speaking_parts?: {
    part_name: string;
    questions: (string | Question)[];
    [key: string]: any;
  }[];

  [key: string]: any;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface ApiError {
  message: string;
  code?: string | number;
  status?: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

// ============================================
// Test Session Types
// ============================================

export interface TestSession {
  id: string;
  user_id: string;
  passage_id: string;
  score?: number;
  total_questions?: number;
  correct_answers?: number;
  time_spent?: number;
  duration_minutes?: number;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
  user_responses?: UserResponse[];
  content_data?: TestContentData;
  [key: string]: unknown;
}

export interface UserResponse {
  response?: string;
  task1_response?: string;
  task2_response?: string;
  word_count?: number;
  [key: string]: unknown;
}

export interface TestContentData {
  last_saved_at?: string;
  sectionStats?: Record<string, unknown>;
  typeStats?: Record<string, unknown>;
  correctAnswersMap?: Record<string, unknown>;
  totalQuestions?: number;
  correctAnswers?: number;
  percentage?: number;
  [key: string]: unknown;
}

export interface TestResults {
  bandScore: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  userResponses?: Record<string, unknown>;
  sectionStats?: Record<string, unknown>;
  typeStats?: Record<string, unknown>;
  correctAnswersMap?: Record<string, unknown>;
}

// ============================================
// Gamification Types
// ============================================

export interface UserPointsData {
  id: string;
  user_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'reading' | 'listening' | 'writing' | 'speaking' | 'general';
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface UserAchievementData {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: AchievementData;
}

// ============================================
// Analytics Types
// ============================================

export interface AnalyticsData {
  totalTests: number;
  averageScore: number;
  testsThisWeek: number;
  skillBreakdown: SkillBreakdown;
  recentActivity: RecentActivity[];
}

export interface SkillBreakdown {
  reading: SkillScore;
  listening: SkillScore;
  writing: SkillScore;
  speaking: SkillScore;
}

export interface SkillScore {
  score: number;
  tests: number;
  improvement: number;
}

export interface RecentActivity {
  id: string;
  type: 'test' | 'achievement' | 'streak';
  title: string;
  timestamp: string;
  score?: number;
}

// ============================================
// Subscription Types
// ============================================

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionFeature {
  name: string;
  included: boolean;
  limit?: number | string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: SubscriptionFeature[];
  stripePriceId?: string;
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
