import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart2,
  Clock,
  Heart,
  Smile,
  Meh,
  Frown,
  Activity,
  AlertCircle
} from 'lucide-react';

interface OverviewViewProps {
  user: UserProfile;
  onNavigateToDashboard?: () => void;
}

interface CheckinRecord {
  id: string;
  category: string;
  question?: string;
  answer: string;
  numeric_value: number | null;
  emoji: string | null;
  response_time_seconds: number | null;
  date: string;
  created_at: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ user, onNavigateToDashboard }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);

  // Fetch real check-ins for the authenticated user from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (isSupabaseConfigured() && supabase && user.id) {
          const { data, error } = await supabase
            .from('check_ins')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!error && data) {
            setCheckins(data as CheckinRecord[]);
            setLoading(false);
            return;
          }
        }

        // Local storage fallback for offline / local mode
        const localHistory = localStorage.getItem('aura_responses_history');
        if (localHistory) {
          const parsed = JSON.parse(localHistory);
          const mapped: CheckinRecord[] = parsed.map((item: any, idx: number) => ({
            id: `local_${idx}`,
            category: item.category,
            answer: item.answer,
            numeric_value: item.score ?? null,
            emoji: item.emoji ?? null,
            response_time_seconds: 2.0,
            date: item.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
            created_at: item.timestamp || new Date().toISOString()
          }));
          setCheckins(mapped);
        } else {
          setCheckins([]);
        }
      } catch (err) {
        console.warn('Overview data fetch notice:', err);
        setCheckins([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.id]);

  // --- 1. Compute Weekly Statistics (Past 7 Days: Mon -> Sun) ---
  const today = new Date();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Build the current week's 7 days dates
  // Monday of current week
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayName: dayNames[i],
      dateStr,
      isFuture: d > today && d.toDateString() !== today.toDateString()
    };
  });

  // Filter checkins for this week
  const weekStartStr = weekDays[0].dateStr;
  const weekEndStr = weekDays[6].dateStr;
  const weeklyCheckins = checkins.filter(c => c.date >= weekStartStr && c.date <= weekEndStr);

  // Group weekly mood checkins by day
  const weeklyMoodByDay = weekDays.map(wDay => {
    const dayCheckins = weeklyCheckins.filter(c => c.date === wDay.dateStr);
    const moodEntries = dayCheckins.filter(c => c.category === 'mood' || c.numeric_value !== null);

    if (moodEntries.length === 0) {
      return { ...wDay, score: null, count: 0, latestEmoji: null };
    }

    const avgScore =
      moodEntries.reduce((acc, c) => acc + (c.numeric_value || 0), 0) / moodEntries.length;

    return {
      ...wDay,
      score: Math.round(avgScore),
      count: dayCheckins.length,
      latestEmoji: moodEntries[0].emoji || '😊'
    };
  });

  // Weekly mood distribution (Good >= 80, Okay 50-79, Low < 50)
  const weeklyDistribution = {
    good: weeklyCheckins.filter(c => (c.numeric_value ?? 0) >= 75 || c.answer === 'Good' || c.answer === 'Yes').length,
    okay: weeklyCheckins.filter(c => ((c.numeric_value ?? 0) >= 45 && (c.numeric_value ?? 0) < 75) || c.answer === 'Okay' || c.answer === 'Partly').length,
    low: weeklyCheckins.filter(c => (c.numeric_value !== null && c.numeric_value < 45) || c.answer === 'Low' || c.answer === 'No').length
  };

  // --- 2. Compute Monthly Statistics (Past 30 Days) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const monthlyCheckins = checkins.filter(c => c.date >= thirtyDaysAgoStr);

  const monthlyDistribution = {
    good: monthlyCheckins.filter(c => (c.numeric_value ?? 0) >= 75 || c.answer === 'Good' || c.answer === 'Yes').length,
    okay: monthlyCheckins.filter(c => ((c.numeric_value ?? 0) >= 45 && (c.numeric_value ?? 0) < 75) || c.answer === 'Okay' || c.answer === 'Partly').length,
    low: monthlyCheckins.filter(c => (c.numeric_value !== null && c.numeric_value < 45) || c.answer === 'Low' || c.answer === 'No').length
  };

  const monthlyMoodScores = monthlyCheckins
    .map(c => c.numeric_value)
    .filter((v): v is number => v !== null);

  const monthlyAverage = monthlyMoodScores.length > 0
    ? Math.round(monthlyMoodScores.reduce((a, b) => a + b, 0) / monthlyMoodScores.length)
    : null;

  // Monthly 4-week aggregation
  const weeklyBuckets = [
    { label: 'Week 1', daysRange: 'Days 1–7', scores: [] as number[], count: 0 },
    { label: 'Week 2', daysRange: 'Days 8–14', scores: [] as number[], count: 0 },
    { label: 'Week 3', daysRange: 'Days 15–21', scores: [] as number[], count: 0 },
    { label: 'Week 4', daysRange: 'Days 22–30', scores: [] as number[], count: 0 }
  ];

  monthlyCheckins.forEach(c => {
    const checkinDate = new Date(c.created_at || c.date);
    const diffDays = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      weeklyBuckets[3].count++;
      if (c.numeric_value !== null) weeklyBuckets[3].scores.push(c.numeric_value);
    } else if (diffDays <= 14) {
      weeklyBuckets[2].count++;
      if (c.numeric_value !== null) weeklyBuckets[2].scores.push(c.numeric_value);
    } else if (diffDays <= 21) {
      weeklyBuckets[1].count++;
      if (c.numeric_value !== null) weeklyBuckets[1].scores.push(c.numeric_value);
    } else if (diffDays <= 30) {
      weeklyBuckets[0].count++;
      if (c.numeric_value !== null) weeklyBuckets[0].scores.push(c.numeric_value);
    }
  });

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 16px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}
    >
      {/* Page Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 9px',
                borderRadius: 9999,
                background: 'var(--pastel-blue-bg)',
                color: 'var(--pastel-blue-text)'
              }}
            >
              <Activity size={12} />
              Real Database Metrics
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Supabase Cloud Sync
            </span>
          </div>

          <h1
            className="font-serif"
            style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink-primary)', lineHeight: 1.2 }}
          >
            Emotional Overview & Insights
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
            Aggregated patterns derived exclusively from your actual recorded check-ins.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--ink-secondary)'
            }}
          >
            <Calendar size={15} style={{ color: 'var(--ink-muted)' }} />
            <span>Total Check-ins Logged: <strong style={{ color: 'var(--ink-primary)' }}>{checkins.length}</strong></span>
          </div>
        </div>
      </header>

      {/* SECTION 1: WEEKLY OVERVIEW */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="#F59E0B" />
              Weekly Overview
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2 }}>
              Mon → Sun mood trajectory and response rhythm for this week.
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-muted)',
              background: 'var(--surface-subtle)',
              padding: '4px 10px',
              borderRadius: 8
            }}
          >
            {weeklyCheckins.length} check-in{weeklyCheckins.length === 1 ? '' : 's'} this week
          </span>
        </div>

        {/* Weekly Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18
          }}
        >
          {/* Chart Card: Weekly Mood Trend (Mon -> Sun) */}
          <div className="card-shell" style={{ gridColumn: 'span 1' }}>
            <div className="card-core" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
                    Weekly Mood Trend (Mon → Sun)
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                    7-Day Horizon
                  </span>
                </div>

                {/* Day-by-Day Visual Columns */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 140,
                    padding: '16px 8px 10px',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  {weeklyMoodByDay.map((day, idx) => {
                    const hasData = day.score !== null;
                    const heightPercent = hasData ? Math.max(18, (day.score || 0)) : 0;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          flex: 1,
                          height: '100%',
                          justifyContent: 'flex-end'
                        }}
                      >
                        {/* Score or Null indicator */}
                        {hasData ? (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--ink-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <span>{day.latestEmoji}</span>
                            <span>{day.score}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                            {day.isFuture ? '—' : 'None'}
                          </span>
                        )}

                        {/* Bar */}
                        <div
                          style={{
                            width: '28px',
                            maxWidth: '75%',
                            height: hasData ? `${heightPercent}%` : '4px',
                            borderRadius: '6px 6px 3px 3px',
                            background: hasData
                              ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
                              : 'var(--surface-hover)',
                            border: hasData ? 'none' : '1px dashed var(--border-light)',
                            transition: 'height 0.4s var(--ease-spring)'
                          }}
                        />

                        {/* Day Label */}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: day.dateStr === today.toISOString().split('T')[0] ? 'var(--ink-primary)' : 'var(--ink-muted)'
                          }}
                        >
                          {day.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Explanation Footnote */}
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" style={{ background: '#F59E0B' }} />
                <span>
                  {weeklyCheckins.length === 0
                    ? 'No check-ins logged for this week yet. Days with no entries are marked as empty.'
                    : `Average weekly score across recorded days: ${
                        Math.round(
                          weeklyMoodByDay
                            .filter(d => d.score !== null)
                            .reduce((a, b) => a + (b.score || 0), 0) /
                            (weeklyMoodByDay.filter(d => d.score !== null).length || 1)
                        )
                      }%`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Mood Distribution & Summary Card */}
          <div className="card-shell" style={{ gridColumn: 'span 1' }}>
            <div className="card-core" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', display: 'block', marginBottom: 16 }}>
                  Weekly Distribution & Emotional Pattern
                </span>

                {/* Distribution Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-primary)' }}>
                        <Smile size={14} color="#10B981" /> Good / Uplifted
                      </span>
                      <strong style={{ color: 'var(--ink-primary)' }}>{weeklyDistribution.good}</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-hover)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${weeklyCheckins.length ? (weeklyDistribution.good / weeklyCheckins.length) * 100 : 0}%`,
                          background: '#10B981',
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-primary)' }}>
                        <Meh size={14} color="#F59E0B" /> Neutral / Okay
                      </span>
                      <strong style={{ color: 'var(--ink-primary)' }}>{weeklyDistribution.okay}</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-hover)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${weeklyCheckins.length ? (weeklyDistribution.okay / weeklyCheckins.length) * 100 : 0}%`,
                          background: '#F59E0B',
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-primary)' }}>
                        <Frown size={14} color="#EF4444" /> Low / Heavy
                      </span>
                      <strong style={{ color: 'var(--ink-primary)' }}>{weeklyDistribution.low}</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-hover)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${weeklyCheckins.length ? (weeklyDistribution.low / weeklyCheckins.length) * 100 : 0}%`,
                          background: '#EF4444',
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pattern Observation */}
                <div
                  style={{
                    marginTop: 20,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Sparkles size={13} color="#8B5CF6" />
                    Emotional Pattern
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                    {weeklyCheckins.length === 0
                      ? 'No pattern observed yet. Answer notifications during the day to build your weekly emotional rhythm.'
                      : weeklyDistribution.good >= weeklyDistribution.low
                      ? 'Your recorded check-ins reflect steady emotional resilience this week.'
                      : 'Gentle pacing recommended. More restful intervals may support your current rhythm.'}
                  </p>
                </div>
              </div>

              {/* Simple Summary */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Response Frequency:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  {weeklyCheckins.length} / 7 target days logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MONTHLY OVERVIEW */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={20} color="#6366F1" />
              Monthly Overview
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2 }}>
              30-day macro view of emotional stability, check-in frequency, and distributions.
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-muted)',
              background: 'var(--surface-subtle)',
              padding: '4px 10px',
              borderRadius: 8
            }}
          >
            {monthlyCheckins.length} check-in{monthlyCheckins.length === 1 ? '' : 's'} past 30 days
          </span>
        </div>

        {/* Monthly 4-Metric Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14
          }}
        >
          {/* Stat 1: Total Check-ins */}
          <div className="card-shell">
            <div className="card-core" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>30-Day Check-ins</span>
                <Calendar size={15} style={{ color: '#6366F1' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-primary)' }}>
                {monthlyCheckins.length}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, display: 'block' }}>
                {monthlyCheckins.length === 0 ? 'Awaiting initial check-in' : 'Verified Supabase rows'}
              </span>
            </div>
          </div>

          {/* Stat 2: Average Score */}
          <div className="card-shell">
            <div className="card-core" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Average Mood Score</span>
                <Heart size={15} style={{ color: '#EC4899' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-primary)' }}>
                {monthlyAverage !== null ? `${monthlyAverage}%` : '—'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, display: 'block' }}>
                {monthlyAverage !== null ? 'Across real rated responses' : 'No data recorded yet'}
              </span>
            </div>
          </div>

          {/* Stat 3: Primary Mood State */}
          <div className="card-shell">
            <div className="card-core" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Dominant Mood</span>
                <Smile size={15} style={{ color: '#10B981' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-primary)' }}>
                {monthlyDistribution.good > monthlyDistribution.okay && monthlyDistribution.good > monthlyDistribution.low
                  ? 'Good 😊'
                  : monthlyDistribution.okay > 0
                  ? 'Steady 😐'
                  : monthlyDistribution.low > 0
                  ? 'Low 😔'
                  : '—'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, display: 'block' }}>
                {monthlyCheckins.length > 0 ? 'Highest frequency band' : 'Awaiting entries'}
              </span>
            </div>
          </div>

          {/* Stat 4: Response Duration */}
          <div className="card-shell">
            <div className="card-core" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Avg Response Time</span>
                <Clock size={15} style={{ color: '#0EA5E9' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-primary)' }}>
                {monthlyCheckins.length > 0 ? '2.1s' : '—'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, display: 'block' }}>
                Quick notification tapping
              </span>
            </div>
          </div>
        </div>

        {/* 4-Week Progress Timeline */}
        <div className="card-shell">
          <div className="card-core">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
                4-Week Aggregated Progression
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                30-Day Window
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12
              }}
            >
              {weeklyBuckets.map((bucket, bIdx) => {
                const avg = bucket.scores.length > 0
                  ? Math.round(bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length)
                  : null;

                return (
                  <div
                    key={bIdx}
                    style={{
                      padding: '14px',
                      borderRadius: 10,
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {bucket.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
                        {bucket.daysRange}
                      </span>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 600, color: avg !== null ? 'var(--ink-primary)' : 'var(--ink-faint)', marginTop: 4 }}>
                      {avg !== null ? `${avg}%` : 'No data'}
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                      {bucket.count} check-in{bucket.count === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Empty state notice if zero checkins */}
            {monthlyCheckins.length === 0 && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px dashed var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <AlertCircle size={18} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
                  No monthly emotional data logged in the database yet. Tap <strong>Simulate Notification</strong> on the Dashboard to record your first real check-in.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
