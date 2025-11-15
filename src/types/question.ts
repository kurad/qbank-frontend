export interface Question {
  id: number | string;
  question_text: string;
  subject_id?: number;
  topic_id?: number;
  grade_id?: number;
  difficulty?: string;
  marks?: number;
  created_at?: string;
  updated_at?: string;
  options?: Array<{
    id: number;
    option_text: string;
    is_correct: boolean;
  }>;
  explanation?: string;
  type?: string;
  topic?: {
    id: number;
    topic_name: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  grade?: {
    id: number;
    grade_name: string;
  };
}

export interface QuestionFilters {
  search: string;
  topic: string | number | null;
  subject: string | number | null;
  grade: string | number | null;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  topic_name: string;
  subject_id?: number;
}

export interface GradeLevel {
  id: number;
  grade_name: string;
}
