export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  approved?: boolean;

}

export interface Department {
  id: string;
  name: string;
  employeeCount: number;
}

export interface Survey {
  id: string;
  name: string;
  status: 'active' | 'draft';
  periodicity: string;
  questionCount: number;
  templateId?: string;
  anonymityThreshold: number;
  departments: string[];
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'likert';
  scale: { min: number; max: number };
}

export interface SurveyTemplate {
  id: string;
  name: string;
  questions: Question[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  responses: Record<string, number>;
  submittedAt: string;
}

export interface WellbeingIndex {
  overall: number;
  burnout: number;
  tension: number;
  coverage: number;
}

export interface ProblemZone {
  department: string;
  factor: string;
  score: number;
  status: 'ok' | 'risk' | 'critical';
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  createdAt: string;
}
