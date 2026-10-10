import React, { useState, useEffect, useRef } from 'react';
import type { NotificationQuestion, MetricCategory } from '../types';

import { Bell, Clock, Check, X, Sparkles } from 'lucide-react';

interface NotificationWidgetProps {
  question: NotificationQuestion;
  onAnswerSelected: (category: MetricCategory, option: { label: string; emoji: string; score: number }, elapsed?: number) => void;
  onDismiss: () => void;
}

export const NotificationWidget: React.FC<NotificationWidgetProps> = ({
  question,
  onAnswerSelected,
  onDismiss
}) => {
  const [elapsed, setElapsed] = useState<number>(0);
  const [answeredOption, setAnsweredOption] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setAnsweredOption(null);
    timerRef.current = window.setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    // Also trigger native browser push notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 Aura: ${question.question}`, {
          body: question.options.map(o => `${o.emoji} ${o.label}`).join('   '),
          icon: '/favicon.svg'
        });
      } catch (e) {}
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.id]);

  const handleSelect = (option: { label: string; emoji: string; score: number }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAnsweredOption(option.label);

    // Answered directly from notification!
    setTimeout(() => {
      onAnswerSelected(question.category, option, Number(elapsed.toFixed(1)));
      onDismiss();
    }, 400);
  };

  return (
    <aside
      className="notification-banner"
      role="region"
      aria-label="Interactive Notification Widget"
      style={{
        width: '100%',
        maxWidth: 440,
        background: '#141518',
        color: '#FFFFFF',
        borderRadius: 22,
        padding: '16px 18px',
        boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        position: 'relative',
        zIndex: 1000
      }}
    >
      {/* Phone Notification Chrome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#141518'
            }}
          >
            <Sparkles size={13} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>
                AURA NOTIFICATION
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>• Just now</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 2–3s Timer indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: '#34D399'
            }}
            title="Fast response time"
          >
            <Clock size={11} />
            <span>{elapsed.toFixed(1)}s</span>
          </div>

          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              padding: 2
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* The Question */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', lineHeight: 1.3 }}>
          🔔 {question.question}
        </p>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          Select directly in notification • Updates dashboard statistics instantly
        </span>
      </div>

      {/* Interactive Options (Answer directly in 2-3s without opening app) */}
      {answeredOption ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            background: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: 12,
            color: '#34D399',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <Check size={16} strokeWidth={3} />
          <span>Recorded & Updated Dashboard ({elapsed.toFixed(1)}s)</span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${question.options.length}, 1fr)`,
            gap: 8
          }}
        >
          {question.options.map(opt => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt)}
              style={{
                background: 'rgba(255, 255, 255, 0.09)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 12,
                padding: '9px 6px',
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.16s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.borderColor = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{ fontSize: 16 }}>{opt.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
