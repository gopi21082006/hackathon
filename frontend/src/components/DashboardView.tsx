import React, { useState } from 'react';
import type {
  MetricCategory,
  MetricState,
  AIInsightItem,
  UserProfile,
  DigitalWellbeingData
} from '../types';

import {
  Sparkles,
  ShieldCheck,
  Bell,
  Smartphone,
  LogOut,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  metrics: Record<MetricCategory, MetricState>;
  insights: AIInsightItem[];
  wellbeing: DigitalWellbeingData;
  recentlyUpdatedCategory: MetricCategory | null;
  onTriggerNotification: (category?: MetricCategory) => void;
  onRequestWellbeingPermission: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  metrics,
  insights,
  wellbeing,
  recentlyUpdatedCategory,
  onTriggerNotification,
  onRequestWellbeingPermission,
  onLogout
}) => {
  const [showWellbeingDetails, setShowWellbeingDetails] = useState<boolean>(false);

  // The 7 mandated categories strictly in order
  const orderedCategories: MetricCategory[] = [
    'mood',
    'sleep',
    'diet',
    'screentime',
    'hobby',
    'productivity',
    'study'
  ];

  // Helper to render responsive mini sparkline graph
  const renderSparkline = (history: number[], color = '#121314') => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const width = 120;
    const height = 32;

    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          opacity="0.75"
        />
        {/* Highlight latest point */}
        {history.length > 0 && (() => {
          const lastVal = history[history.length - 1];
          const lastX = width;
          const lastY = height - ((lastVal - min) / range) * (height - 6) - 3;
          return <circle cx={lastX} cy={lastY} r="3" fill={color} />;
        })()}
      </svg>
    );
  };

  const getMetricColor = (cat: MetricCategory) => {
    switch (cat) {
      case 'mood': return '#F59E0B'; // warm amber
      case 'sleep': return '#6366F1'; // calm indigo
      case 'diet': return '#10B981'; // fresh emerald
      case 'screentime': return '#EC4899'; // phone pink/rose
      case 'hobby': return '#8B5CF6'; // creative purple
      case 'productivity': return '#0EA5E9'; // focus blue
      case 'study': return '#14B8A6'; // teal
      default: return '#121314';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 16px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28
      }}
    >
      {/* 1. Header with User Rhythms & Notification Trigger */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 500 }}>
              Welcome back, {user.name}
            </span>
            <span className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
              Notifications Active
            </span>
          </div>

          <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink-primary)', lineHeight: 1.15 }}>
            Emotional Well-being Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
            Updated automatically whenever you tap phone notification questions in 2–3s.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => onTriggerNotification()}
            className="btn-primary"
            style={{ borderRadius: 10, padding: '9px 15px' }}
            title="Simulate receiving a phone notification to answer directly"
          >
            <Bell size={14} />
            <span>Simulate Notification</span>
          </button>

          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ borderRadius: 10, padding: '8px 12px' }}
            title="Reset/Relog"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. Notification Concept Explainer Banner (Lightweight & Minimal) */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 14,
          padding: '14px 18px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FBF3DB',
              color: '#8C5D00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={16} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', display: 'block' }}>
              Notification = User Input Interface
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              No check-in screens inside the app. Answer tiny questions directly from your phone banner to update the cards below.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['mood', 'diet', 'sleep', 'hobby', 'productivity', 'study'] as MetricCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => onTriggerNotification(cat)}
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                padding: '5px 9px',
                fontSize: 11,
                cursor: 'pointer',
                color: 'var(--ink-primary)',
                fontWeight: 500
              }}
            >
              Test {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. The 7 Mandated Dashboard Cards (Responsive Grid) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
            Daily Well-being Parameters
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            7 Core Metrics
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}
        >
          {orderedCategories.map(cat => {
            const m = metrics[cat];
            const isHighlighted = recentlyUpdatedCategory === cat;
            const accentColor = getMetricColor(cat);

            return (
              <div
                key={cat}
                className="card-shell"
                style={{
                  transition: 'all 0.35s var(--ease-spring)',
                  transform: isHighlighted ? 'scale(1.02)' : 'none',
                  borderColor: isHighlighted ? accentColor : 'var(--border-light)',
                  boxShadow: isHighlighted ? `0 6px 20px -6px ${accentColor}40` : 'none'
                }}
              >
                <div
                  className="card-core"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    height: '100%',
                    background: isHighlighted ? '#FAFAF7' : 'var(--surface)'
                  }}
                >
                  {/* Card Header: Emoji + Title + Updated badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{m.emoji}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {m.label}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: isHighlighted ? '#EDF3EC' : 'var(--surface-subtle)',
                        color: isHighlighted ? '#2C5B30' : 'var(--ink-muted)',
                        fontWeight: 600
                      }}
                    >
                      {isHighlighted ? '✓ Updated' : m.lastUpdated}
                    </span>
                  </div>

                  {/* Main Value & Subtext */}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span
                        className="font-serif"
                        style={{
                          fontSize: 26,
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                          lineHeight: 1.1,
                          display: 'block'
                        }}
                      >
                        {m.currentValue}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-secondary)', marginTop: 2, display: 'block' }}>
                        {m.subtext}
                      </span>
                    </div>

                    {/* Mini Sparkline Graph */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {renderSparkline(m.history, accentColor)}
                    </div>
                  </div>

                  {/* Screen Time specific digital well-being permission banner */}
                  {cat === 'screentime' && (
                    <div
                      style={{
                        marginTop: 4,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10B981' }}>
                        <ShieldCheck size={13} />
                        <span>Permission Active</span>
                      </div>

                      <button
                        onClick={() => setShowWellbeingDetails(!showWellbeingDetails)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--ink-secondary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 11
                        }}
                      >
                        {showWellbeingDetails ? 'Hide Apps' : 'View App Usage'}
                      </button>
                    </div>
                  )}

                  {/* App Usage Drawer for Screen Time */}
                  {cat === 'screentime' && showWellbeingDetails && wellbeing.permissionGranted && (
                    <div
                      style={{
                        background: 'var(--surface-subtle)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 11
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)' }}>
                        <span>Pickups: {wellbeing.pickups} times</span>
                        <span>Auto-tracked</span>
                      </div>
                      {wellbeing.topApps.map(app => (
                        <div key={app.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-primary)' }}>{app.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{app.minutes}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Small AI Insights Section (on the SAME dashboard) */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          padding: '24px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#D97706" />
            <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink-primary)' }}>
              AI Insights & Lifestyle Patterns
            </h3>
          </div>

          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              padding: '3px 8px',
              borderRadius: 6,
              background: 'var(--surface-subtle)',
              color: 'var(--ink-muted)'
            }}
          >
            Non-Medical Correlation
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
          Observational insights synthesized purely from your numerical ratings, notification answers, and screen time duration:
        </p>

        {/* Insight Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {insights.map(item => {
            const tagBg =
              item.tag === 'Pattern noticed'
                ? '#EDF3EC'
                : item.tag === 'Possible relationship'
                ? '#FBF3DB'
                : '#E1F0FA';

            const tagColor =
              item.tag === 'Pattern noticed'
                ? '#2C5B30'
                : item.tag === 'Possible relationship'
                ? '#8C5D00'
                : '#195B8A';

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-subtle)',
                  borderRadius: 14,
                  padding: '16px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: tagBg,
                    color: tagColor
                  }}
                >
                  {item.tag}
                </span>

                <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.45, fontWeight: 500 }}>
                  “{item.text}”
                </p>
              </div>
            );
          })}
        </div>

        {/* Non-medical reassurance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'var(--ink-muted)',
            paddingTop: 8,
            borderTop: '1px solid var(--border-light)'
          }}
        >
          <Info size={13} style={{ flexShrink: 0 }} />
          <span>
            These observations are designed for gentle self-reflection based on your recent answers. They do not constitute clinical or medical advice.
          </span>
        </div>
      </section>
    </div>
  );
};
