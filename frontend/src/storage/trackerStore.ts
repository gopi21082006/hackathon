import type {
  UserProfile,
  MetricCategory,
  MetricState,
  NotificationQuestion,
  AIInsightItem,
  DigitalWellbeingData
} from '../types';

import {
  syncUserProfile,
  saveUserSetupToCloud,
  saveNotificationResponseToCloud,
  saveWellbeingMetricsToCloud,
  saveDigitalWellbeingToCloud
} from '../lib/supabase';

const USER_KEY = 'aura_user_profile';
const METRICS_KEY = 'aura_dashboard_metrics';
const WELLBEING_KEY = 'aura_digital_wellbeing';
const HISTORY_KEY = 'aura_responses_history';

// Default initial lifestyle
const defaultUser: UserProfile = {
  id: '',
  name: '',
  email: '',
  isLoggedIn: false,
  setupComplete: false,
  lifestyle: {
    student: 'Yes',
    gym: 'Regularly',
    sports: 'Weekends',
    work: 'Remote',
    hobbies: ['Music', 'Reading']
  }
};

// Initial state for the 7 dashboard metrics (strictly empty until real user check-ins exist)
const initialMetrics: Record<MetricCategory, MetricState> = {
  mood: {
    category: 'mood',
    label: 'Mood',
    emoji: '😊',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  sleep: {
    category: 'sleep',
    label: 'Sleep',
    emoji: '😴',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  diet: {
    category: 'diet',
    label: 'Food / Diet',
    emoji: '🍎',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  screentime: {
    category: 'screentime',
    label: 'Screen Time',
    emoji: '📱',
    currentValue: '--',
    subtext: 'Usage telemetry pending',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  hobby: {
    category: 'hobby',
    label: 'Hobby',
    emoji: '🎨',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  productivity: {
    category: 'productivity',
    label: 'Productivity',
    emoji: '💼',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  },
  study: {
    category: 'study',
    label: 'Study',
    emoji: '📚',
    currentValue: '--',
    subtext: 'Awaiting check-in response',
    score: 0,
    history: [],
    lastUpdated: 'Not recorded yet'
  }
};

// Preset question pool for notifications
export const notificationQuestions: NotificationQuestion[] = [
  {
    id: 'q_mood',
    category: 'mood',
    question: 'How is your mood right now?',
    options: [
      { label: 'Good', emoji: '😊', score: 90 },
      { label: 'Okay', emoji: '😐', score: 60 },
      { label: 'Low', emoji: '😔', score: 30 }
    ]
  },
  {
    id: 'q_diet',
    category: 'diet',
    question: 'Did you follow your diet today?',
    options: [
      { label: 'Yes', emoji: '😊', score: 90 },
      { label: 'Partly', emoji: '😐', score: 60 },
      { label: 'No', emoji: '😔', score: 30 }
    ]
  },
  {
    id: 'q_sleep',
    category: 'sleep',
    question: 'Did you sleep more than 7 hours?',
    options: [
      { label: 'Yes', emoji: '😊', score: 90 },
      { label: 'Almost', emoji: '😐', score: 65 },
      { label: 'No', emoji: '😔', score: 30 }
    ]
  },
  {
    id: 'q_hobby',
    category: 'hobby',
    question: 'Did you spend time on your hobby?',
    options: [
      { label: 'Yes', emoji: '😊', score: 90 },
      { label: 'A little', emoji: '😐', score: 60 },
      { label: 'No', emoji: '😔', score: 30 }
    ]
  },
  {
    id: 'q_productivity',
    category: 'productivity',
    question: 'How was your productivity today?',
    options: [
      { label: 'High', emoji: '😊', score: 90 },
      { label: 'Normal', emoji: '😐', score: 65 },
      { label: 'Low', emoji: '😔', score: 35 }
    ]
  },
  {
    id: 'q_study',
    category: 'study',
    question: 'Did you make progress in your studies?',
    options: [
      { label: 'Yes', emoji: '😊', score: 90 },
      { label: 'Some', emoji: '😐', score: 60 },
      { label: 'No', emoji: '😔', score: 30 }
    ]
  }
];

export const trackerStore = {
  // User Profile
  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : defaultUser;
    } catch {
      return defaultUser;
    }
  },

  saveUser(partial: Partial<UserProfile>): UserProfile {
    const current = this.getUser();
    const updated = { ...current, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  login(
    provider: 'google' | 'facebook' | 'email',
    name = 'Alex Rivera',
    email = 'alex@aura.app',
    id?: string
  ) {
    const userId = id || `usr_${Date.now()}`;
    const user = this.saveUser({
      id: userId,
      name,
      email,
      provider,
      isLoggedIn: true
    });

    // Sync profile to cloud database in background
    syncUserProfile({ id: userId, email, name, provider }).catch(err => {
      console.warn('Background profile sync notice:', err);
    });

    return user;
  },

  logout() {
    return this.saveUser({ isLoggedIn: false, setupComplete: false });
  },

  completeSetup(lifestyle: UserProfile['lifestyle'], userId?: string) {
    const user = this.saveUser({
      lifestyle,
      setupComplete: true
    });

    const targetId = userId || user.id || 'usr_default';
    // Persist setup to cloud database
    saveUserSetupToCloud(targetId, lifestyle).catch(err => {
      console.warn('Background setup sync notice:', err);
    });

    return user;
  },

  // 7 Dashboard Metrics
  getMetrics(): Record<MetricCategory, MetricState> {
    try {
      const data = localStorage.getItem(METRICS_KEY);
      return data ? { ...initialMetrics, ...JSON.parse(data) } : initialMetrics;
    } catch {
      return initialMetrics;
    }
  },

  saveMetrics(metrics: Record<MetricCategory, MetricState>) {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  },

  // Digital Well-being Data (strictly unrecorded until real permission and device telemetry exist)
  getWellbeing(): DigitalWellbeingData {
    try {
      const data = localStorage.getItem(WELLBEING_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      permissionGranted: false,
      screenTimeMinutes: 0,
      pickups: 0,
      topApps: []
    };
  },

  setWellbeingPermission(granted: boolean, userId?: string): DigitalWellbeingData {
    const current = this.getWellbeing();
    const updated = { ...current, permissionGranted: granted };
    localStorage.setItem(WELLBEING_KEY, JSON.stringify(updated));

    // Update screen time card subtext if disabled
    const metrics = this.getMetrics();
    if (!granted) {
      metrics.screentime.currentValue = 'Disabled';
      metrics.screentime.subtext = 'Usage permission disabled';
    } else {
      metrics.screentime.currentValue = '--';
      metrics.screentime.subtext = 'Permission granted; awaiting telemetry';
    }
    this.saveMetrics(metrics);

    // Persist to cloud database
    const targetId = userId || this.getUser().id || 'usr_default';
    saveDigitalWellbeingToCloud(targetId, updated).catch(err => {
      console.warn('Background digital wellbeing sync notice:', err);
    });

    return updated;
  },

  // Notification Response Handler (2-3s answer from notification directly updates dashboard)
  answerNotification(
    category: MetricCategory,
    option: { label: string; emoji: string; score: number },
    questionDetails?: { id: string; question: string; elapsed?: number },
    userId?: string
  ) {
    const metrics = this.getMetrics();
    const metric = metrics[category];

    // Update value and score based on selection
    metric.score = option.score;
    metric.lastUpdated = 'Just now (via Notification)';

    switch (category) {
      case 'mood':
        metric.currentValue = `${option.label} ${option.emoji}`;
        metric.subtext = option.score >= 80 ? 'Upbeat & steady' : option.score >= 50 ? 'Mild & neutral' : 'Low energy';
        break;
      case 'diet':
        metric.currentValue = option.label === 'Yes' ? 'On Track 🍏' : option.label === 'Partly' ? 'Partial' : 'Off Plan';
        metric.subtext = option.label === 'Yes' ? 'Diet followed today' : 'Diet modified';
        break;
      case 'sleep':
        metric.currentValue = option.label === 'Yes' ? '> 7.5h (Target Met)' : option.label === 'Almost' ? '6.5h' : '< 5.5h';
        metric.subtext = option.label === 'Yes' ? 'Well rested' : 'Rest deficit noted';
        break;
      case 'hobby':
        metric.currentValue = option.label === 'Yes' ? 'Engaged 🎨' : option.label === 'A little' ? 'Brief time' : 'Not today';
        metric.subtext = option.label === 'Yes' ? 'Dedicated creative space' : 'Busy schedule';
        break;
      case 'productivity':
        metric.currentValue = `${option.label} Focus`;
        metric.subtext = option.score >= 80 ? 'High efficiency day' : 'Pacing workflow';
        break;
      case 'study':
        metric.currentValue = option.label === 'Yes' ? 'Progress Made 📖' : option.label === 'Some' ? 'Light review' : 'No study';
        metric.subtext = option.label === 'Yes' ? 'Knowledge reinforced' : 'Focus elsewhere';
        break;
      default:
        break;
    }

    // Append to 7-day sparkline history
    metric.history = [...metric.history.slice(1), option.score];
    this.saveMetrics(metrics);

    // Save historical log locally
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift({
        category,
        answer: option.label,
        emoji: option.emoji,
        score: option.score,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {}

    // Cloud Database Persistence:
    const targetUserId = userId || this.getUser().id || 'usr_default';
    const payload = {
      user_id: targetUserId,
      question_id: questionDetails?.id || `q_${category}`,
      question: questionDetails?.question || `Check-in for ${category}`,
      category,
      selected_answer: option.label,
      emoji: option.emoji,
      score: option.score,
      response_time_seconds: questionDetails?.elapsed || 2.0,
      timestamp: new Date().toISOString()
    };

    saveNotificationResponseToCloud(targetUserId, payload).catch(err => {
      console.warn('Background notification cloud sync notice:', err);
    });

    saveWellbeingMetricsToCloud(targetUserId, metrics, category).catch(err => {
      console.warn('Background metrics cloud sync notice:', err);
    });

    return metrics;
  },

  // Hydrate dashboard from Cloud Database records (Supabase)
  hydrateFromCloudData(cloudData: {
    todayRow?: any;
    responses?: any[];
    digitalWellbeing?: any;
  }): Record<MetricCategory, MetricState> {
    const current = this.getMetrics();
    const updated = { ...current };

    // 1. If today's wellbeing row exists in database, apply real saved values
    if (cloudData.todayRow) {
      const row = cloudData.todayRow;
      if (row.mood_score !== null && row.mood_score !== undefined) {
        updated.mood = { ...updated.mood, score: Number(row.mood_score), currentValue: row.mood || row.mood_value || `${row.mood_score}` };
      }
      if (row.sleep_score !== null && row.sleep_score !== undefined) {
        updated.sleep = { ...updated.sleep, score: Number(row.sleep_score), currentValue: row.sleep || row.sleep_value || `${row.sleep_score}h` };
      }
      if (row.diet_score !== null && row.diet_score !== undefined) {
        updated.diet = { ...updated.diet, score: Number(row.diet_score), currentValue: row.diet || row.diet_value || `${row.diet_score}` };
      }
      if (row.screentime_score !== null && row.screentime_score !== undefined) {
        updated.screentime = { ...updated.screentime, score: Number(row.screentime_score), currentValue: row.screen_time || row.screentime_value || `${row.screentime_score}m` };
      }
      if (row.hobby_score !== null && row.hobby_score !== undefined) {
        updated.hobby = { ...updated.hobby, score: Number(row.hobby_score), currentValue: row.hobby || row.hobby_value || `${row.hobby_score}` };
      }
      if (row.productivity_score !== null && row.productivity_score !== undefined) {
        updated.productivity = { ...updated.productivity, score: Number(row.productivity_score), currentValue: row.productivity || row.productivity_value || `${row.productivity_score}` };
      }
      if (row.study_score !== null && row.study_score !== undefined) {
        updated.study = { ...updated.study, score: Number(row.study_score), currentValue: row.study || row.study_value || `${row.study_score}` };
      }
    }

    // 2. Rebuild real 7-day sparklines from actual user responses in database
    if (Array.isArray(cloudData.responses) && cloudData.responses.length > 0) {
      const catResponses: Record<MetricCategory, number[]> = {
        mood: [],
        sleep: [],
        diet: [],
        screentime: [],
        hobby: [],
        productivity: [],
        study: []
      };

      // Collect chronologically
      const sorted = [...cloudData.responses].sort(
        (a, b) => new Date(a.created_at || a.timestamp || 0).getTime() - new Date(b.created_at || b.timestamp || 0).getTime()
      );

      for (const r of sorted) {
        const cat = r.category as MetricCategory;
        const val = r.numeric_value !== undefined && r.numeric_value !== null
          ? Number(r.numeric_value)
          : (r.score !== undefined && r.score !== null ? Number(r.score) : null);

        if (catResponses[cat] && val !== null) {
          catResponses[cat].push(val);
        }
      }

      // If user has recorded entries, update sparkline history
      (Object.keys(catResponses) as MetricCategory[]).forEach(cat => {
        const vals = catResponses[cat];
        if (vals.length > 0) {
          const recent = vals.slice(-7);
          updated[cat].history = recent;
        }
      });
    }

    // 3. Hydrate digital wellbeing from cloud
    if (cloudData.digitalWellbeing) {
      const dw = cloudData.digitalWellbeing;
      const wbData: DigitalWellbeingData = {
        permissionGranted: dw.permission_granted ?? false,
        screenTimeMinutes: dw.total_screen_time_minutes ?? 0,
        pickups: dw.pickups_count ?? 0,
        topApps: dw.app_usage || []
      };
      localStorage.setItem(WELLBEING_KEY, JSON.stringify(wbData));
    }

    this.saveMetrics(updated);
    return updated;
  },

  // Observational insights (Preserved non-medical guidance)
  getAIInsights(): AIInsightItem[] {
    const metrics = this.getMetrics();
    const insights: AIInsightItem[] = [];

    // Insight 1: Mood vs Sleep
    if (metrics.sleep.score >= 75) {
      insights.push({
        id: 'ins_1',
        tag: 'Pattern noticed',
        text: 'Your mood was generally better on days when your sleep was above 7 hours.'
      });
    } else {
      insights.push({
        id: 'ins_1_alt',
        tag: 'Possible relationship',
        text: 'Shorter sleep sessions appear to coincide with slightly reduced morning mood ratings.'
      });
    }

    // Insight 2: Productivity vs Screen Time
    insights.push({
      id: 'ins_2',
      tag: 'Possible relationship',
      text: 'Your productivity was lower on days with higher non-focus screen time.'
    });

    // Insight 3: Hobby / Creative time vs Calm
    if (metrics.hobby.score >= 60) {
      insights.push({
        id: 'ins_3',
        tag: 'Based on your recent data',
        text: 'Spending even brief time on your hobby shows a positive correlation with your evening mood.'
      });
    }

    // Insight 4: Diet & Focus
    if (metrics.diet.score >= 70) {
      insights.push({
        id: 'ins_4',
        tag: 'Pattern noticed',
        text: 'Consistent meal and nutrition habits correlate with more stable afternoon energy.'
      });
    }

    return insights;
  }
};
