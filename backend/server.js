import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './database.js';
import { analyzeWellbeingPatterns } from './aiEngine.js';
import {
  supabase,
  isSupabaseConfigured,
  verifyUserToken,
  getProfile,
  upsertProfile,
  getUserSetup,
  upsertUserSetup,
  saveNotificationResponse,
  getNotificationResponses,
  upsertWellbeingData,
  getDashboardData,
  upsertDigitalWellbeing
} from './supabase.js';
import { getAICompanionResponse } from './aiChatService.js';
import { getMenakaResponse, generateMenakaFallback, detectCrisisIntent, getCrisisResponse } from './menakaService.js';
import { synthesizeSpeech } from './ttsService.js';
import { generateGuidedMeditation, getFeatureFlags } from './relaxService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lightweight in-memory rate limiter per IP
const ipRequestCounts = new Map();
function rateLimiter(limit = 60, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const clientData = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count += 1;
    }
    ipRequestCounts.set(ip, clientData);

    if (clientData.count > limit) {
      return res.status(429).json({
        error: 'Too many requests. Please pause for a moment.',
        error_ta: 'அதிக கோரிக்கைகள். தயவுசெய்து சிறிது நேரம் காத்திருக்கவும்.',
        error_tanglish: 'Romba requests vandhurukku. Konjam wait pannunga.'
      });
    }
    next();
  };
}

app.use('/api/', rateLimiter(90, 60000));

// Middleware: Authenticate user using Supabase JWT Bearer token
// Enforces user-level data isolation
async function requireAuth(req, res, next) {
  const user = await verifyUserToken(req.headers.authorization);
  if (!user) {
    // If Supabase is not configured yet, allow fallback for smooth local testing
    if (!isSupabaseConfigured()) {
      req.user = { id: 'usr_local_default', email: 'alex@aura.app', user_metadata: { name: 'Alex Rivera' } };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Valid Supabase authentication token required' });
  }
  req.user = user;
  next();
}

// Health & System Status with Cloud DB verification
app.get('/api/status', (req, res) => {
  const checkins = db.getCheckins();
  const wellbeing = db.getWellbeing();
  const settings = db.getSettings();

  res.json({
    status: 'online',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    cloudDatabase: {
      provider: 'Supabase',
      configured: isSupabaseConfigured(),
      url: process.env.SUPABASE_URL ? 'Configured' : 'Not set'
    },
    metrics: {
      checkinsCount: checkins.length,
      wellbeingDaysCount: wellbeing.length,
      lastSyncedAt: settings.lastSyncedAt
    },
    settings
  });
});

// ====================================================
// Authentication & Profile Endpoints
// ====================================================

// Supabase Email Auth Helper
app.post('/api/auth/email', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  if (!isSupabaseConfigured() || !supabase) {
    // Local development fallback
    return res.json({
      success: true,
      mode: 'local_offline',
      message: 'Supabase not configured. Operating in local mode.',
      user: {
        id: `local_${email.split('@')[0]}`,
        email,
        name: email.split('@')[0],
        provider: 'email'
      }
    });
  }

  try {
    // If service role key is available, ensure user exists in auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
      let targetUser = userList?.users?.find(u => u.email === email);

      if (!targetUser) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { name: email.split('@')[0] }
        });
        if (createError) throw createError;
        targetUser = newUser.user;
      }

      // Ensure profile row exists
      await upsertProfile({
        id: targetUser.id,
        name: targetUser.user_metadata?.name || email.split('@')[0],
        email: targetUser.email,
        provider: 'email'
      });

      return res.json({
        success: true,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.user_metadata?.name || email.split('@')[0],
          provider: 'email'
        }
      });
    }

    // Default Supabase Auth passwordless OTP / Magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });

    if (error) throw error;
    res.json({ success: true, message: 'Magic link / OTP sent via Supabase Auth', data });
  } catch (err) {
    console.error('Email auth error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// User Profile: Retrieve Profile
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const profile = await getProfile(req.user.id);
      return res.json({ profile: profile || req.user });
    }
    res.json({
      profile: {
        id: req.user.id,
        name: req.user.user_metadata?.name || 'Alex Rivera',
        email: req.user.email,
        provider: 'email'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Profile: Update Profile
app.post('/api/user/profile', requireAuth, async (req, res) => {
  const { name, provider } = req.body;
  try {
    if (isSupabaseConfigured()) {
      const profile = await upsertProfile({
        id: req.user.id,
        name: name || req.user.user_metadata?.name || req.user.email?.split('@')[0],
        email: req.user.email,
        provider: provider || 'email'
      });
      return res.json({ success: true, profile });
    }
    res.json({ success: true, profile: { id: req.user.id, name, email: req.user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// User Setup (Lifestyle Onboarding)
// ====================================================

// Get User Setup
app.get('/api/user/setup', requireAuth, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const setup = await getUserSetup(req.user.id);
      return res.json({ setup });
    }
    const settings = db.getSettings();
    res.json({ setup: settings.setup || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save User Setup
app.post('/api/user/setup', requireAuth, async (req, res) => {
  const { lifestyle } = req.body;
  if (!lifestyle) {
    return res.status(400).json({ error: 'Lifestyle object is required' });
  }

  try {
    if (isSupabaseConfigured()) {
      const saved = await upsertUserSetup(req.user.id, lifestyle);
      return res.json({ success: true, setup: saved });
    }
    db.updateSettings({ setup: lifestyle });
    res.json({ success: true, setup: lifestyle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// Notification Responses (2-3s Phone Banner Answers)
// ====================================================

// Record notification response
app.post('/api/notifications/response', requireAuth, async (req, res) => {
  const { response } = req.body;
  if (!response || !response.category) {
    return res.status(400).json({ error: 'Notification response object is required' });
  }

  try {
    if (isSupabaseConfigured()) {
      const saved = await saveNotificationResponse(req.user.id, response);
      return res.json({ success: true, response: saved });
    }

    // Local JSON store fallback
    const checkinItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.id,
      category: response.category,
      question: response.question,
      questionId: response.question_id || response.questionId,
      answer: response.selected_answer || response.selectedAnswer || response.answer,
      emoji: response.emoji,
      score: response.score,
      responseTimeSeconds: response.response_time_seconds || 2.0,
      timestamp: new Date().toISOString()
    };
    db.upsertCheckins([checkinItem]);

    res.json({ success: true, response: checkinItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user notification responses history
app.get('/api/notifications/responses', requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  try {
    if (isSupabaseConfigured()) {
      const responses = await getNotificationResponses(req.user.id, limit);
      return res.json({ responses });
    }
    const checkins = db.getCheckins(limit);
    res.json({ responses: checkins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// Well-being Data & Dashboard Retrieval
// ====================================================

// Save current aggregated well-being metrics (7 parameters)
app.post('/api/wellbeing/data', requireAuth, async (req, res) => {
  const { metrics, date } = req.body;
  if (!metrics) {
    return res.status(400).json({ error: 'Metrics object is required' });
  }

  try {
    if (isSupabaseConfigured()) {
      const saved = await upsertWellbeingData(req.user.id, { ...metrics, date });
      return res.json({ success: true, wellbeing: saved });
    }
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve Dashboard Data for authenticated user
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const dashboard = await getDashboardData(req.user.id);
      return res.json({ success: true, ...dashboard });
    }

    const checkins = db.getCheckins(50);
    const wellbeing = db.getWellbeing(7);
    res.json({
      success: true,
      todayRow: null,
      responses: checkins,
      digitalWellbeing: wellbeing[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// Digital Well-being / Device Telemetry
// ====================================================

// Save device telemetry (Screen time & App usage)
app.post('/api/wellbeing/device', requireAuth, async (req, res) => {
  const telemetry = req.body;
  try {
    if (isSupabaseConfigured()) {
      const saved = await upsertDigitalWellbeing(req.user.id, telemetry);
      return res.json({ success: true, telemetry: saved });
    }

    const log = {
      id: `wb_${telemetry.date || new Date().toISOString().split('T')[0]}`,
      userId: req.user.id,
      date: telemetry.date || new Date().toISOString().split('T')[0],
      totalScreenTimeMinutes: telemetry.screenTimeMinutes || telemetry.total_screen_time_minutes || 222,
      pickupsCount: telemetry.pickups || telemetry.pickups_count || 48,
      lateNightScreenMinutes: telemetry.lateNightScreenMinutes || 25,
      categories: telemetry.categories || { productivity: 110, social: 52 },
      longestSessionMinutes: telemetry.longestSessionMinutes || 45,
      syncedAt: new Date().toISOString()
    };
    db.upsertWellbeing([log]);
    res.json({ success: true, telemetry: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy check-ins & wellbeing endpoints (kept for backward compatibility)
app.post('/api/checkins/sync', (req, res) => {
  const { checkins } = req.body;
  if (!Array.isArray(checkins)) {
    return res.status(400).json({ error: 'Expected checkins array' });
  }
  const count = db.upsertCheckins(checkins);
  db.updateSettings({ lastSyncedAt: new Date().toISOString() });
  res.json({
    success: true,
    synced: checkins.length,
    totalCheckins: count,
    syncedAt: new Date().toISOString()
  });
});

app.get('/api/checkins', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const checkins = db.getCheckins(limit);
  res.json({ checkins });
});

app.post('/api/wellbeing/sync', (req, res) => {
  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'Expected logs array' });
  }
  const count = db.upsertWellbeing(logs);
  db.updateSettings({ lastSyncedAt: new Date().toISOString() });
  res.json({
    success: true,
    synced: logs.length,
    totalDays: count,
    syncedAt: new Date().toISOString()
  });
});

app.get('/api/wellbeing', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const wellbeing = db.getWellbeing(days);
  res.json({ wellbeing });
});

// Preserved non-medical insights engine (No new AI prediction implemented)
app.get('/api/insights', (req, res) => {
  const checkins = db.getCheckins(200);
  const wellbeing = db.getWellbeing(60);
  const analysis = analyzeWellbeingPatterns(checkins, wellbeing);
  res.json(analysis);
});

// Cloud Database Schema Definition
app.get('/api/cloud-schema', (req, res) => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    res.json({
      targetEngines: ['PostgreSQL', 'Supabase'],
      sql: schemaSql
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// AI Companion Chatbot & Mood-Aware Processing
// ====================================================
app.post('/api/chat', async (req, res) => {
  const { message, history = [], userId } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    // 1. Resolve user identity from Authorization header or body
    let activeUser = await verifyUserToken(req.headers.authorization);
    const targetUserId = activeUser?.id || userId;

    let userContext = {
      name: activeUser?.user_metadata?.name || 'friend',
      todayMood: 'Not recorded yet',
      recentCheckins: [],
      lifestyle: {}
    };

    // 2. Hydrate real emotional and profile context from Supabase if available
    if (targetUserId && isSupabaseConfigured() && supabase) {
      try {
        // Fetch profile
        const profile = await getProfile(targetUserId);
        if (profile?.name) userContext.name = profile.name;

        // Fetch today's wellbeing metrics row
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRow } = await supabase
          .from('wellbeing_data')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('date', today)
          .single();

        if (todayRow && (todayRow.mood || todayRow.mood_score)) {
          userContext.todayMood = `${todayRow.mood || 'Recorded'} (Score: ${todayRow.mood_score || 'N/A'})`;
        }

        // Fetch recent 5 checkins
        const recentCheckins = await getNotificationResponses(targetUserId, 5);
        if (recentCheckins && recentCheckins.length > 0) {
          userContext.recentCheckins = recentCheckins.map(c => ({
            category: c.category,
            answer: c.answer,
            emoji: c.emoji,
            date: c.date
          }));
        }

        // Fetch lifestyle
        const setup = await getUserSetup(targetUserId);
        if (setup) {
          userContext.lifestyle = setup;
        }
      } catch (err) {
        console.warn('Context hydration notice:', err.message);
      }
    }

    // 3. Generate response using AI Chat Service (Gemini/OpenAI or context engine)
    const result = await getAICompanionResponse({
      message,
      history,
      userContext
    });

    res.json({
      success: true,
      reply: result.reply,
      gift: result.gift || null
    });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({
      error: 'Failed to generate AI response',
      reply: "I'm right here with you 🌱 Just taking a soft breath. Tell me a bit more."
    });
  }
});

// ====================================================
// Menaka AI Companion: Trilingual Chat (Tamil/Tanglish/English)
// ====================================================
app.post('/api/menaka/chat', async (req, res) => {
  const { message, history = [], preferredLanguage = 'auto', userId } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    let activeUser = await verifyUserToken(req.headers.authorization);
    const targetUserId = activeUser?.id || userId;

    let userContext = {
      name: activeUser?.user_metadata?.name || 'friend',
      todayMood: 'Not recorded yet'
    };

    if (targetUserId && isSupabaseConfigured() && supabase) {
      try {
        const profile = await getProfile(targetUserId);
        if (profile?.name) userContext.name = profile.name;
      } catch (err) {
        console.warn('Menaka profile hydration notice:', err.message);
      }
    }

    const result = await getMenakaResponse({
      message,
      history,
      preferredLanguage,
      userContext
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Menaka chat error:', err);
    const fallback = generateMenakaFallback({ message, preferredLanguage, history });
    res.json({
      success: true,
      ...fallback
    });
  }
});

// Streaming Server-Sent Events (SSE) for Menaka Chat
app.post('/api/menaka/stream', async (req, res) => {
  const { message, history = [], preferredLanguage = 'auto', userId } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  try {
    // 1. Instant check for crisis
    if (detectCrisisIntent(message)) {
      const crisisResp = getCrisisResponse(preferredLanguage, message);
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: crisisResp.display_text })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', meta: crisisResp })}\n\n`);
      return res.end();
    }

    // 2. Fetch full Menaka structured result
    const result = await getMenakaResponse({
      message,
      history,
      preferredLanguage,
      userContext: { name: 'friend' }
    });

    // 3. Stream display text smoothly in token chunks
    const fullText = result.display_text || '';
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i === words.length - 1 ? '' : ' ');
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      // Brief breathing delay for organic streaming feel
      await new Promise(r => setTimeout(r, 25));
    }

    // 4. Send completion with full metadata
    res.write(`data: ${JSON.stringify({ type: 'done', meta: result })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Menaka streaming error:', err);
    const fallback = generateMenakaFallback({ message, preferredLanguage, history });
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: fallback.display_text })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', meta: fallback })}\n\n`);
    res.end();
  }
});

// ====================================================
// Dedicated Mood Detection Endpoint
// ====================================================
app.post('/api/mood', async (req, res) => {
  const text = req.body.text || req.body.message || '';
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for mood analysis' });
  }

  try {
    const analysis = await getMenakaResponse({
      message: text,
      history: [],
      preferredLanguage: 'auto'
    });

    res.json({
      success: true,
      mood: analysis.mood || 'neutral',
      intensity: analysis.intensity || 3,
      reason: analysis.reason_for_mood || 'Detected from context',
      crisis: Boolean(analysis.crisis)
    });
  } catch (err) {
    console.error('Mood detection error:', err);
    res.json({
      success: true,
      mood: 'neutral',
      intensity: 2,
      reason: 'Standard baseline',
      crisis: false
    });
  }
});

// ====================================================
// Text-to-Speech (TTS) Synthesis Endpoint
// ====================================================
app.post('/api/tts', async (req, res) => {
  const { text, languageCode = 'ta-IN' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS synthesis' });
  }

  try {
    const result = await synthesizeSpeech({ text, languageCode });
    res.json(result);
  } catch (err) {
    console.error('TTS endpoint error:', err);
    res.status(500).json({
      success: false,
      fallbackToBrowser: true,
      error: 'TTS synthesis error: ' + err.message
    });
  }
});

// ====================================================
// Relax Zone: Guided Meditation & Config Endpoints
// ====================================================
app.post('/api/relax/meditation', async (req, res) => {
  const { mood = 'neutral', language = 'english', durationMinutes = 2 } = req.body;

  try {
    const meditation = await generateGuidedMeditation({
      mood,
      language,
      durationMinutes
    });
    res.json({ success: true, meditation });
  } catch (err) {
    console.error('Guided meditation generator error:', err);
    res.status(500).json({ error: 'Failed to generate meditation' });
  }
});

app.get('/api/relax/config', (req, res) => {
  res.json({
    featureFlags: getFeatureFlags(),
    supportedMoods: ['happy', 'sad', 'anxious', 'stressed', 'angry', 'tired', 'neutral']
  });
});

// ====================================================
// Real Overview & Emotional Statistics Endpoint
// ====================================================
app.get('/api/overview', async (req, res) => {
  try {
    let activeUser = await verifyUserToken(req.headers.authorization);
    const targetUserId = activeUser?.id || req.query.userId;

    if (targetUserId && isSupabaseConfigured() && supabase) {
      const { data: checkins, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return res.json({ success: true, checkins: checkins || [] });
    }

    // Fallback local check-ins
    const checkins = db.getCheckins(100);
    res.json({ success: true, checkins });
  } catch (err) {
    console.error('Overview endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset endpoint
app.post('/api/reset', (req, res) => {
  db.clear();
  res.json({ success: true, message: 'All local data reset' });
});

// Full data export
app.get('/api/export', (req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    data: db.data
  });
});

// Serve frontend dist if available
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Emotional Well-being Backend running on http://localhost:${PORT}`);
  console.log(`Supabase Cloud Status: ${isSupabaseConfigured() ? 'Connected' : 'Local Fallback (Credentials Pending)'}`);
});
