// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
export type StatusType = 'ok' | 'low' | 'risk' | 'critical';

export interface WellbeingIndex {
  overall: number;
  status: StatusType;
}

export interface MetricValue {
  value: number;
  status: StatusType;
}

export interface SurveyCoverage {
  value: number;
  period: string;
}

export interface DashboardMetrics {
  wellbeingIndex: WellbeingIndex;
  burnoutRisk: MetricValue;
  tensionConflicts: MetricValue;
  surveyCoverage: SurveyCoverage;
}

export interface DynamicsPoint {
  week: string;
  value: number;
}

export interface ProblemZone {
  id?: string;
  department: string;
  factor: string;
  score: number;
  status: StatusType;
  affectedEmployees?: number;
  trend?: string;
}

export interface Recommendation {
  department: string;
  issue: string;
  action: string;
  status: StatusType;
}

// ─── Surveys ────────────────────────────────────────────────────────────────
export type SurveyStatus = 'active' | 'draft' | 'closed';

export interface Survey {
  id: string;
  name: string;
  departments: string[];
  status: SurveyStatus;
  anonymityThreshold: number;
  createdAt: string;
  templateName?: string;
  archived?: boolean;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'scale' | 'text' | 'choice';
  options?: string[];
}

// ─── Notifications ──────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'warning' | 'critical' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ─── Navigation ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Surveys: undefined;
  Zones: undefined;
  Notifications: undefined;
  Profile: undefined;
  Generator: undefined;
};
