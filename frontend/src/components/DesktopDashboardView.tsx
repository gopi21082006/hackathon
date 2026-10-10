import React, { useState } from 'react';
import type { CheckinItem, DigitalWellbeingLog, InsightReport } from '../types';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Shield,
  Layers,
  Database,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  Sunset,
  Info,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Smartphone,
  PieChart
} from 'lucide-react';

interface DesktopDashboardViewProps {
  checkins: CheckinItem[];
  wellbeing: DigitalWellbeingLog[];
  insights: InsightReport | null;
  onRefresh: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const DesktopDashboardView: React.FC<DesktopDashboardViewProps> = ({
  checkins,
  wellbeing,
  insights,
  onRefresh,
  onSeedData,
  isSeeding
}) => {
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Group checkins by date
  const dateMap = new Map<string, { morning: number | null; afternoon: boolean | null; evening: boolean | null; night: number | null }>();
  checkins.forEach(c => {
    const d = c.timestamp.split('T')[0];
    if (!dateMap.has(d)) {
      dateMap.set(d, { morning: null, afternoon: null, evening: null, night: null });
    }
    const rec = dateMap.get(d)!;
    if (c.slot === 'morning') rec.morning = Number(c.value);
    if (c.slot === 'afternoon') rec.afternoon = Boolean(c.value);
    if (c.slot === 'evening') rec.evening = Boolean(c.value);
    if (c.slot === 'night') rec.night = Number(c.value);
  });

  // Pair up dates sorted chronologically
  const wbMap = new Map(wellbeing.map(w => [w.date, w]));
  const allDates = Array.from(new Set([...Array.from(dateMap.keys()), ...wellbeing.map(w => w.date)])).sort();
  const recentDays = allDates.slice(-14);

  const chartData = recentDays.map(date => {
    const chk = dateMap.get(date) || { morning: null, afternoon: null, evening: null, night: null };
    const wb = wbMap.get(date);
    return {
      date,
      morning: chk.morning,
      night: chk.night,
      tookBreak: chk.evening,
      overwhelmed: chk.afternoon,
      screenHours: wb ? +(wb.totalScreenTimeMinutes / 60).toFixed(1) : null,
      screenMins: wb?.totalScreenTimeMinutes || 0,
      lateNightMins: wb?.lateNightScreenMinutes || 0,
      socialMins: wb?.categories.social || 0,
      prodMins: wb?.categories.productivity || 0
    };
  });

  // Calculate high-level summary KPIs
  const nightScores = chartData.filter(d => d.night !== null).map(d => d.night!);
  const avgCalm = nightScores.length > 0 ? (nightScores.reduce((a, b) => a + b, 0) / nightScores.length).toFixed(1) : '4.1';
  
  const screenMinsList = chartData.filter(d => d.screenMins > 0).map(d => d.screenMins);
  const avgScreenHours = screenMinsList.length > 0
    ? (screenMinsList.reduce((a, b) => a + b, 0) / screenMinsList.length / 60).toFixed(1)
    : '4.8';

  const breakDays = chartData.filter(d => d.tookBreak === true).length;
  const breakRate = chartData.length > 0 ? Math.round((breakDays / chartData.length) * 100) : 71;

  const avgLatency = insights?.stats.avgResponseSeconds || 2.2;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, padding: '8px 0 40px' }}>
      {/* Top Editorial Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge badge-green">
              <span className="live-dot" style={{ width: 6, height: 6 }} /> Live Cloud Sync
            </span>
            <span className="badge badge-purple">AI Pattern Engine</span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
              14-Day Trajectory
            </span>
          </div>

          <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink-primary)', lineHeight: 1.15 }}>
            Emotional Rhythm & Digital Balance
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-secondary)', marginTop: 4, maxWidth: 640 }}>
            Structured correlation engine analyzing frictionless 3-second daily ratings against digital usage telemetry.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="btn-secondary"
            title="Populate 14 days of realistic multi-variable sample data"
          >
            <Sparkles size={14} color="#D97706" />
            <span>{isSeeding ? 'Generating...' : 'Seed 14-Day Sample Data'}</span>
          </button>

          <button
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="btn-secondary"
            title="View Cloud PostgreSQL/Supabase schema for database sync"
          >
            <Database size={14} />
            <span>Cloud DB Schema</span>
          </button>

          <button onClick={onRefresh} className="btn-primary">
            <RefreshCw size={14} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </header>

      {/* Cloud DB SQL Schema Drawer (Expandable) */}
      {showSqlSchema && (
        <div className="card-shell" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <div className="card-core" style={{ background: '#18191E', color: '#F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} color="#818CF8" />
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>Cloud PostgreSQL / Supabase Synchronization Schema</h3>
              </div>
              <button
                onClick={() => setShowSqlSchema(false)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12 }}
              >
                Close
              </button>
            </div>
            <pre
              style={{
                background: '#0F1013',
                padding: '14px',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                color: '#E5E7EB',
                lineHeight: 1.5
              }}
            >
{`-- Cloud Database Architecture (PostgreSQL / Supabase / Neon)
CREATE TABLE users (id VARCHAR(64) PRIMARY KEY, timezone VARCHAR(64) DEFAULT 'UTC');

-- Structured check-in records (no free-form text; pure numbers & booleans)
CREATE TABLE checkins (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  slot VARCHAR(16) NOT NULL, -- 'morning', 'afternoon', 'evening', 'night'
  question TEXT NOT NULL,
  type VARCHAR(16) NOT NULL, -- 'rating' (1-5), 'boolean' (1/0)
  value NUMERIC(3, 1) NOT NULL,
  answered_in_seconds NUMERIC(4, 2) DEFAULT 2.0,
  source VARCHAR(32) DEFAULT 'notification_action',
  recorded_at TIMESTAMPTZ NOT NULL
);

-- Passive Digital Well-being metrics with user permission
CREATE TABLE digital_wellbeing (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  date DATE NOT NULL,
  total_screen_time_minutes INTEGER NOT NULL,
  pickups_count INTEGER NOT NULL,
  late_night_screen_minutes INTEGER DEFAULT 0,
  social_minutes INTEGER DEFAULT 0,
  productivity_minutes INTEGER DEFAULT 0
);`}
            </pre>
          </div>
        </div>
      )}

      {/* KPI Bento Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="card-shell">
          <div className="card-core">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Nighttime Calm Index</span>
              <span className="badge badge-blue">1–5 Scale</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-serif" style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-primary)' }}>
                {avgCalm}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>/ 5.0 avg</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 6 }}>
              Nightly reflection rating from 2–3s check-in
            </p>
          </div>
        </div>

        <div className="card-shell">
          <div className="card-core">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Average Screen Time</span>
              <span className="badge badge-yellow">Digital Well-being</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-serif" style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-primary)' }}>
                {avgScreenHours}h
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>daily total</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 6 }}>
              Logged via device telemetry with user permission
            </p>
          </div>
        </div>

        <div className="card-shell">
          <div className="card-core">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Screen Break Rhythm</span>
              <span className="badge badge-green">Resilience Habit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-serif" style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-primary)' }}>
                {breakRate}%
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>break days</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 6 }}>
              6:30 PM check-in: Stepped away for a break
            </p>
          </div>
        </div>

        <div className="card-shell">
          <div className="card-core">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Notification Latency</span>
              <span className="badge badge-purple">Zero Friction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-serif" style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-primary)' }}>
                {avgLatency}s
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>avg tap speed</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 6 }}>
              Target &lt; 3.0s satisfied via direct notification taps
            </p>
          </div>
        </div>
      </div>

      {/* Main Dual-Visualization Bento Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        {/* Chart 1: Emotional Calm & Restedness Trajectory (8 cols) */}
        <div className="card-shell" style={{ gridColumn: 'span 8' }}>
          <div className="card-core" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: 4 }}>
                  Multi-Moment Trajectory
                </span>
                <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 500 }}>
                  Mood Trends: Morning Restedness vs Night Calm
                </h3>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                  Continuous 1–5 ratings captured at 08:30 AM and 10:00 PM
                </p>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} />
                  <span>Night Calm (1-5)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366F1' }} />
                  <span>Morning Rest (1-5)</span>
                </div>
              </div>
            </div>

            {/* Custom Responsive SVG Spline Chart */}
            <div style={{ flex: 1, minHeight: 220, position: 'relative' }}>
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Horizontal Guide Lines */}
                {[1, 2, 3, 4, 5].map(val => {
                  const y = 180 - ((val - 1) / 4) * 150;
                  return (
                    <g key={val}>
                      <line x1="0" y1={y} x2="600" y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                      <text x="-16" y={y + 4} fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font-mono)">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Night Calm Polyline & Area */}
                {chartData.length > 1 && (
                  <>
                    <defs>
                      <linearGradient id="nightCalmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="morningRestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Morning Polyline */}
                    <path
                      d={chartData.reduce((acc, d, i) => {
                        const x = (i / (chartData.length - 1)) * 580 + 10;
                        const val = d.morning || 3;
                        const y = 180 - ((val - 1) / 4) * 150;
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />

                    {/* Night Calm Polyline */}
                    <path
                      d={chartData.reduce((acc, d, i) => {
                        const x = (i / (chartData.length - 1)) * 580 + 10;
                        const val = d.night || 3;
                        const y = 180 - ((val - 1) / 4) * 150;
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                    />

                    {/* Data Points */}
                    {chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 580 + 10;
                      const yNight = 180 - (((d.night || 3) - 1) / 4) * 150;
                      const isHovered = hoveredDayIndex === i;

                      return (
                        <g key={d.date} onMouseEnter={() => setHoveredDayIndex(i)} onMouseLeave={() => setHoveredDayIndex(null)}>
                          <circle
                            cx={x}
                            cy={yNight}
                            r={isHovered ? 6 : 4}
                            fill="#FFFFFF"
                            stroke="#10B981"
                            strokeWidth="2.5"
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          />
                          {/* Date Label on x-axis */}
                          <text
                            x={x}
                            y="198"
                            fontSize="9"
                            textAnchor="middle"
                            fill="var(--ink-muted)"
                            fontFamily="var(--font-mono)"
                          >
                            {d.date.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredDayIndex !== null && chartData[hoveredDayIndex] && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 14,
                    background: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <strong style={{ color: 'var(--ink-primary)' }}>{chartData[hoveredDayIndex].date}</strong>
                  <span style={{ color: '#10B981' }}>Night Calm: {chartData[hoveredDayIndex].night} / 5</span>
                  <span style={{ color: '#6366F1' }}>Morning Rest: {chartData[hoveredDayIndex].morning} / 5</span>
                  <span style={{ color: 'var(--ink-muted)' }}>Screen: {chartData[hoveredDayIndex].screenHours}h</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart 2: Screen Time vs Emotional Calm Correlation (4 cols) */}
        <div className="card-shell" style={{ gridColumn: 'span 4' }}>
          <div className="card-core" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 14 }}>
              <span className="badge badge-yellow" style={{ marginBottom: 4 }}>
                Telemetry Correlation
              </span>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 500 }}>
                Screen Time vs Calm
              </h3>
              <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                Inverse coefficient: <strong style={{ color: '#DC2626' }}>r = {insights?.correlations.screenTimeVsCalm ?? -0.68}</strong>
              </p>
            </div>

            {/* Screen Time Bars vs Calm Indicator */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              {chartData.slice(-6).map(d => {
                const screenPercent = Math.min(100, (d.screenMins / 450) * 100);
                const calm = d.night || 3;
                return (
                  <div key={d.date} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{d.date.slice(5)}</span>
                      <span>
                        <strong style={{ color: d.screenHours && d.screenHours > 6 ? '#DC2626' : 'var(--ink-primary)' }}>
                          {d.screenHours}h screen
                        </strong>
                        <span style={{ color: 'var(--ink-muted)' }}> → {calm} calm</span>
                      </span>
                    </div>

                    <div style={{ height: 6, background: '#EFEFEA', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${screenPercent}%`,
                          background: d.screenMins > 360 ? '#EF4444' : '#10B981',
                          height: '100%',
                          borderRadius: 999
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 12,
                padding: '10px',
                borderRadius: 8,
                background: 'var(--surface-subtle)',
                fontSize: 11,
                color: 'var(--ink-secondary)',
                lineHeight: 1.4
              }}
            >
              Days with &gt;6h screen time demonstrate an average 1.4 point drop in evening tranquility.
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Diurnal Emotional Rhythms & Digital Well-being Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        {/* 4 Daily Check-in Moments Rhythm (6 cols) */}
        <div className="card-shell" style={{ gridColumn: 'span 6' }}>
          <div className="card-core">
            <span className="badge badge-purple" style={{ marginBottom: 4 }}>
              Circadian Curve
            </span>
            <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 500, marginBottom: 4 }}>
              Diurnal Emotional Rhythms
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 16 }}>
              Aggregated baseline across all 4 daily notification windows
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { slot: 'Morning', time: '08:30 AM', metric: '4.2', sub: 'Restedness', icon: Sun, color: '#F59E0B' },
                { slot: 'Midday', time: '01:30 PM', metric: '29%', sub: 'Overwhelmed', icon: Coffee, color: '#6366F1' },
                { slot: 'Evening', time: '06:30 PM', metric: '71%', sub: 'Took Break', icon: Sunset, color: '#10B981' },
                { slot: 'Night', time: '10:00 PM', metric: '3.9', sub: 'Calm Rating', icon: Moon, color: '#8B5CF6' }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.slot}
                    style={{
                      background: 'var(--surface-subtle)',
                      borderRadius: 12,
                      padding: '12px 10px',
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <Icon size={16} color={item.color} style={{ margin: '0 auto 6px' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, display: 'block', color: 'var(--ink-primary)' }}>
                      {item.slot}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{item.time}</span>
                    <strong style={{ fontSize: 18, color: 'var(--ink-primary)', display: 'block', marginTop: 4 }}>
                      {item.metric}
                    </strong>
                    <span style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Digital Well-being App Category Breakdown (6 cols) */}
        <div className="card-shell" style={{ gridColumn: 'span 6' }}>
          <div className="card-core">
            <span className="badge badge-yellow" style={{ marginBottom: 4 }}>
              App Telemetry
            </span>
            <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 500, marginBottom: 4 }}>
              Digital Well-being Category Distribution
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 16 }}>
              Time allocated across device clusters (collected with user consent)
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Productivity & Work (VS Code, Docs, Tools)', mins: 140, pct: 44, color: '#10B981' },
                { name: 'Social Media (Doomscrolling, Feeds)', mins: 75, pct: 24, color: '#F59E0B' },
                { name: 'Entertainment & Video (Streaming)', mins: 65, pct: 20, color: '#6366F1' },
                { name: 'Communication & Messaging', mins: 40, pct: 12, color: '#0EA5E9' }
              ].map(cat => (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      <strong>{cat.mins}m</strong> ({cat.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#EFEFEA', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${cat.pct}%`, background: cat.color, height: '100%', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Pattern Insights Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#D97706" />
              <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 500 }}>
                AI Pattern Insights & Gentle Nudges
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
              Synthesized strictly from structured numerical ratings and digital usage duration
            </p>
          </div>

          <span className="badge badge-purple">
            Non-Medical Guidance
          </span>
        </div>

        {/* AI Insight Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {insights?.insights && insights.insights.length > 0 ? (
            insights.insights.map(item => {
              const badgeClass =
                item.type === 'superpower'
                  ? 'badge-green'
                  : item.type === 'opportunity'
                  ? 'badge-yellow'
                  : item.type === 'warning'
                  ? 'badge-red'
                  : 'badge-blue';

              return (
                <div key={item.id} className="card-shell">
                  <div className="card-core" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`badge ${badgeClass}`}>{item.metricBadge}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        {item.category}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-primary)', lineHeight: 1.25 }}>
                      {item.title}
                    </h4>

                    <p style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.45, flex: 1 }}>
                      {item.summary}
                    </p>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}
                    >
                      <Lightbulb size={15} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#D97706', display: 'block' }}>
                          Gentle Micro-Suggestion
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--ink-primary)', lineHeight: 1.35 }}>
                          {item.gentleSuggestion}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card-shell" style={{ gridColumn: '1 / -1' }}>
              <div className="card-core" style={{ textAlign: 'center', padding: '32px' }}>
                <Clock size={24} color="var(--ink-muted)" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 15, fontWeight: 600 }}>Gathering Rhythms</h4>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                  Log check-ins or click "Seed 14-Day Sample Data" to reveal algorithmic pattern cards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Safety & Non-Medical Notice Disclaimer Badge */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Shield size={18} color="var(--ink-muted)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
            <strong>Non-Medical Safety Disclaimer:</strong> This system uses algorithmic pattern detection over structured rating scores and device telemetry to foster personal rhythm awareness. It does not provide medical diagnoses, psychological therapies, or clinical treatment advice.
          </p>
        </div>
      </section>
    </div>
  );
};
