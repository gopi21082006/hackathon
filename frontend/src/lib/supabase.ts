import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type {
  UserProfile,
  MetricCategory,
  MetricState,
  DigitalWellbeingData,
  NotificationResponsePayload
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-ref')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Real Google OAuth authentication through Supabase.
 * Opens Google's official account selector & OAuth consent.
 */
export async function signInWithGoogle() {
  if (!supabase) {
    return { error: new Error('Supabase not configured in environment variables') };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

/**
 * Real Facebook OAuth authentication through Supabase.
 * Redirects to Facebook's official OAuth authentication dialog.
 */
export async function signInWithFacebook() {
  if (!supabase) {
    return { error: new Error('Supabase not configured in environment variables') };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: window.location.origin
    }
  });
}

/**
 * Email authentication through Supabase Auth (Passwordless OTP / Magic link).
 */
export async function signInWithEmail(email: string) {
  if (!supabase) {
    return { error: null, session: null, isOffline: true };
  }

  // 1. First trigger backend helper if available
  try {
    const res = await fetch('/api/auth/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        return { data, error: null };
      }
    }
  } catch (e) {
    // Backend fetch failed, continue directly to Supabase client
  }

  // 2. Direct Supabase Auth OTP / Magic Link
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      shouldCreateUser: true
    }
  });
  return { data, error };
}

/**
 * Sign out the authenticated session
 */
export async function signOutUser() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
  }
}

/**
 * Retrieve current active session
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieve Bearer token for backend calls
 */
export async function getBearerToken(): Promise<string> {
  const session = await getSession();
  if (session?.access_token) {
    return `Bearer ${session.access_token}`;
  }
  return 'Bearer local_default';
}

// ========================================================
// Cloud Database Operations (Row Level Security protected)
// ========================================================

/**
 * Profile: Fetch or create profile for authenticated user
 */
export async function syncUserProfile(user: { id: string; email: string; name: string; provider?: string }) {
  if (!supabase) return null;

  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) return existing;

    // Create profile
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider || 'email',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) console.warn('Could not insert profile (may already exist):', error.message);
    return created;
  } catch (err) {
    console.error('syncUserProfile error:', err);
    return null;
  }
}

/**
 * User Setup: Fetch user setup from database
 */
export async function fetchUserSetupFromCloud(userId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_setup')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('fetchUserSetup error:', error.message);
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * User Setup: Save user setup answers to cloud database
 */
export async function saveUserSetupToCloud(userId: string, lifestyle: UserProfile['lifestyle']) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_setup')
      .upsert({
        user_id: userId,
        student: lifestyle.student,
        gym: lifestyle.gym,
        sports: lifestyle.sports,
        work: lifestyle.work,
        hobbies: lifestyle.hobbies,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('saveUserSetupToCloud error:', error.message);
    }
    return data;
  } catch (err) {
    console.error('saveUserSetupToCloud exception:', err);
    return null;
  }
}

/**
 * Notification Response: Save response directly to cloud database
 */
export async function saveNotificationResponseToCloud(
  userId: string,
  payload: NotificationResponsePayload
) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from('check_ins').insert({
        user_id: userId,
        question_id: payload.question_id,
        question: payload.question,
        category: payload.category,
        answer: payload.selected_answer,
        numeric_value: payload.score,
        emoji: payload.emoji || '',
        response_time_seconds: payload.response_time_seconds || 2.0,
        date: payload.date || today
      });
    } catch (err) {
      console.error('Cloud notification response save error:', err);
    }
  }

  // Also sync to backend API endpoint
  try {
    const authHeader = await getBearerToken();
    await fetch('/api/notifications/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        response: {
          ...payload,
          user_id: userId,
          date: today,
          timestamp: now
        }
      })
    });
  } catch (e) {
    // Offline resilience
  }
}

/**
 * Dashboard Data: Retrieve real user data from cloud database
 */
export async function fetchDashboardDataFromCloud(userId: string) {
  if (!supabase) return null;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's wellbeing metrics row
    const { data: todayRow } = await supabase
      .from('wellbeing_data')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Fetch last 50 check-in responses to build sparklines
    const { data: responses } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch digital wellbeing record
    const { data: digitalWb } = await supabase
      .from('digital_wellbeing')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    return {
      todayRow,
      responses: responses || [],
      digitalWellbeing: digitalWb || null
    };
  } catch (err) {
    console.error('fetchDashboardDataFromCloud error:', err);
    return null;
  }
}

/**
 * Save current 7 dashboard metrics to cloud database
 */
export async function saveWellbeingMetricsToCloud(
  userId: string,
  metrics: Record<MetricCategory, MetricState>,
  lastUpdatedCat?: MetricCategory
) {
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    user_id: userId,
    date: today,
    mood: metrics.mood?.currentValue,
    mood_score: metrics.mood?.score,
    sleep: metrics.sleep?.currentValue,
    sleep_score: metrics.sleep?.score,
    diet: metrics.diet?.currentValue,
    diet_score: metrics.diet?.score,
    screen_time: metrics.screentime?.currentValue,
    screentime_score: metrics.screentime?.score,
    hobby: metrics.hobby?.currentValue,
    hobby_score: metrics.hobby?.score,
    productivity: metrics.productivity?.currentValue,
    productivity_score: metrics.productivity?.score,
    study: metrics.study?.currentValue,
    study_score: metrics.study?.score,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase
        .from('wellbeing_data')
        .upsert(payload, { onConflict: 'user_id, date' });
    } catch (err) {
      console.error('saveWellbeingMetricsToCloud error:', err);
    }
  }

  // Also send to backend
  try {
    const authHeader = await getBearerToken();
    await fetch('/api/wellbeing/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ metrics: payload, date: today })
    });
  } catch {}
}

/**
 * Digital Well-being / Device Telemetry: Save to cloud database
 */
export async function saveDigitalWellbeingToCloud(
  userId: string,
  data: DigitalWellbeingData
) {
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    user_id: userId,
    date: today,
    total_screen_time_minutes: data.screenTimeMinutes,
    pickups_count: data.pickups,
    permission_granted: data.permissionGranted,
    app_usage: data.topApps,
    synced_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase
        .from('digital_wellbeing')
        .upsert(payload, { onConflict: 'user_id, date' });
    } catch (err) {
      console.error('saveDigitalWellbeingToCloud error:', err);
    }
  }

  // Also send to backend
  try {
    const authHeader = await getBearerToken();
    await fetch('/api/wellbeing/device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });
  } catch {}
}
