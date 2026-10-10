// Core Domain Types for Aura Emotional Well-being Tracker

export type AppStep = 'login' | 'setup' | 'dashboard';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  provider?: 'google' | 'facebook' | 'email';
  isLoggedIn: boolean;
  setupComplete: boolean;
  lifestyle: {
    student: 'Yes' | 'No' | 'Pursuing';
    gym: 'Regularly' | 'Occasionally' | 'No';
    sports: 'Active' | 'Weekends' | 'Rarely';
    work: 'Full-time' | 'Freelance' | 'Remote' | 'None';
    hobbies: string[];
  };
}

export type MetricCategory =
  | 'mood'
  | 'sleep'
  | 'diet'
  | 'screentime'
  | 'hobby'
  | 'productivity'
  | 'study';

export interface NotificationQuestion {
  id: string;
  category: MetricCategory;
  question: string;
  options: Array<{
    label: string;
    emoji: string;
    score: number; // 1 (Low), 2 (Medium), 3 (Good/High)
  }>;
}

export interface MetricState {
  category: MetricCategory;
  label: string;
  emoji: string;
  currentValue: string;
  subtext: string;
  score: number; // 0 to 100 percentage or rating
  history: number[]; // 7-day sparkline points
  lastUpdated: string;
}

export interface AIInsightItem {
  id: string;
  tag: 'Pattern noticed' | 'Possible relationship' | 'Based on your recent data';
  text: string;
}

export interface DigitalWellbeingData {
  permissionGranted: boolean;
  screenTimeMinutes: number;
  pickups: number;
  topApps: Array<{ name: string; minutes: number; category: string }>;
}

export interface NotificationResponsePayload {
  user_id?: string;
  question_id: string;
  question: string;
  category: MetricCategory;
  selected_answer: string;
  emoji?: string;
  score: number;
  response_time_seconds?: number;
  date?: string;
  timestamp?: string;
}
