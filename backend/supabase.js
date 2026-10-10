import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Verifies JWT token passed from the frontend Bearer Authorization header.
 * Ensures strict user data isolation so User A cannot access User B's data.
 */
export async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return null;
      }
      return user;
    } catch (err) {
      console.error('Error verifying Supabase token:', err.message);
      return null;
    }
  }

  // Fallback for local development if cloud credentials are not yet set
  if (token.startsWith('local_')) {
    const parts = token.split('_');
    return {
      id: parts[1] || 'usr_default',
      email: `${parts[1] || 'user'}@aura.app`,
      user_metadata: { name: parts[1] || 'Alex Rivera' }
    };
  }

  return null;
}

// ==========================================
// User Profile Service
// ==========================================
export async function getProfile(userId) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getProfile error:', error.message);
  }
  return data;
}

export async function upsertProfile({ id, name, email, provider }) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id,
      name,
      email,
      provider: provider || 'email',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('upsertProfile error:', error.message);
    throw error;
  }
  return data;
}

// ==========================================
// User Setup (Lifestyle) Service
// ==========================================
export async function getUserSetup(userId) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('user_setup')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getUserSetup error:', error.message);
  }
  return data;
}

export async function upsertUserSetup(userId, lifestyle) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const payload = {
    user_id: userId,
    student: lifestyle.student || 'Yes',
    gym: lifestyle.gym || 'Regularly',
    sports: lifestyle.sports || 'Weekends',
    work: lifestyle.work || 'Remote',
    hobbies: Array.isArray(lifestyle.hobbies) ? lifestyle.hobbies : ['Music', 'Reading'],
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_setup')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('upsertUserSetup error:', error.message);
    throw error;
  }
  return data;
}

// ==========================================
// Notification Responses Service
// ==========================================
export async function saveNotificationResponse(userId, response) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    user_id: userId,
    question_id: response.question_id || response.questionId || 'q_unknown',
    question: response.question || '',
    category: response.category,
    answer: response.selected_answer || response.selectedAnswer || response.answer || '',
    numeric_value: response.score !== undefined ? Number(response.score) : (response.numeric_value !== undefined ? Number(response.numeric_value) : null),
    emoji: response.emoji || '',
    response_time_seconds: Number(response.response_time_seconds || response.responseTimeSeconds || 2.0),
    date: response.date || today
  };

  const { data, error } = await supabase
    .from('check_ins')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('saveNotificationResponse error:', error.message);
    throw error;
  }

  return data;
}

export async function getNotificationResponses(userId, limit = 50) {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getNotificationResponses error:', error.message);
    return [];
  }
  return data || [];
}

// ==========================================
// Well-being Data Service (Dashboard Aggregation)
// ==========================================
export async function upsertWellbeingData(userId, metricsData) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    user_id: userId,
    date: metricsData.date || today,
    mood: metricsData.mood ?? metricsData.mood_value ?? metricsData.mood?.currentValue,
    mood_score: metricsData.mood_score ?? metricsData.mood?.score,
    sleep: metricsData.sleep ?? metricsData.sleep_value ?? metricsData.sleep?.currentValue,
    sleep_score: metricsData.sleep_score ?? metricsData.sleep?.score,
    diet: metricsData.diet ?? metricsData.diet_value ?? metricsData.diet?.currentValue,
    diet_score: metricsData.diet_score ?? metricsData.diet?.score,
    screen_time: metricsData.screen_time ?? metricsData.screentime_value ?? metricsData.screentime?.currentValue,
    screentime_score: metricsData.screentime_score ?? metricsData.screentime?.score,
    hobby: metricsData.hobby ?? metricsData.hobby_value ?? metricsData.hobby?.currentValue,
    hobby_score: metricsData.hobby_score ?? metricsData.hobby?.score,
    productivity: metricsData.productivity ?? metricsData.productivity_value ?? metricsData.productivity?.currentValue,
    productivity_score: metricsData.productivity_score ?? metricsData.productivity?.score,
    study: metricsData.study ?? metricsData.study_value ?? metricsData.study?.currentValue,
    study_score: metricsData.study_score ?? metricsData.study?.score,
    updated_at: new Date().toISOString()
  };

  // Clean undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase
    .from('wellbeing_data')
    .upsert(payload, { onConflict: 'user_id, date' })
    .select()
    .single();

  if (error) {
    console.error('upsertWellbeingData error:', error.message);
  }
  return data;
}

export async function getDashboardData(userId) {
  if (!isSupabaseConfigured() || !supabase) return null;

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's wellbeing row
  const { data: todayRow } = await supabase
    .from('wellbeing_data')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  // Fetch recent check-in responses for sparkline generation
  const { data: responses } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch latest digital wellbeing
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
}

// ==========================================
// Digital Well-being / Device Data Telemetry
// ==========================================
export async function upsertDigitalWellbeing(userId, telemetry) {
  if (!isSupabaseConfigured() || !supabase) return null;
  const today = telemetry.date || new Date().toISOString().split('T')[0];

  const payload = {
    user_id: userId,
    date: today,
    total_screen_time_minutes: telemetry.total_screen_time_minutes ?? telemetry.screenTimeMinutes ?? 222,
    pickups_count: telemetry.pickups_count ?? telemetry.pickups ?? 48,
    late_night_screen_minutes: telemetry.late_night_screen_minutes ?? 25,
    permission_granted: telemetry.permission_granted ?? telemetry.permissionGranted ?? true,
    app_usage: telemetry.app_usage ?? telemetry.topApps ?? [],
    categories: telemetry.categories ?? {},
    longest_session_minutes: telemetry.longest_session_minutes ?? 45,
    synced_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('digital_wellbeing')
    .upsert(payload, { onConflict: 'user_id, date' })
    .select()
    .single();

  if (error) {
    console.error('upsertDigitalWellbeing error:', error.message);
  }
  return data;
}
