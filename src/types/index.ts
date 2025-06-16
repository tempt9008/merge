export interface Folder {
  id: string;
  name: string;
  created_at: string;
  is_enabled: boolean;
  parent_folder_id?: string | null; // Add optional parent folder ID
}

export interface Category {
  id: string;
  name: string;
  folder_id: string;
  created_at: string;
  is_enabled: boolean;
}

export interface Question {
  id: string;
  category_id: string;
  type: 'text' | 'truefalse' | 'multichoice' | 'image';
  question: string;
  correct_answer: string;
  options?: string[];
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}
