import React, { useState, useEffect, useRef } from 'react';
import type { CheckinSlot, CheckinType, CheckinItem } from '../types';
import { localStore } from '../storage/localStore';
import { Check, Clock, Bell, X, Sparkles } from 'lucide-react';

interface NotificationBannerProps {
  slot: CheckinSlot;
  question: string;
  type: CheckinType;
  onDismiss: () => void;
  onAnswered: (item: CheckinItem) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  slot,
  question,
  type,
  onDismiss,
  onAnswered
}) => {
  const [elapsed, setElapsed] = useState<number>(0);
  const [answeredValue, setAnsweredValue] = useState<number | boolean | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slot]);

  const handleSelect = (val: number | boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalSeconds = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    setAnsweredValue(val);

    // Save locally on device first (Offline-first)
    const saved = localStore.saveCheckinLocally({
      userId: 'usr_default',
      slot,
      question,
      type,
      value: val,
      answeredInSeconds: Math.max(0.5, finalSeconds),
      source: 'notification_action',
      timestamp: new Date().toISOString()
    });

    // Provide visual feedback for 400ms then dismiss
    setTimeout(() => {
      onAnswered(saved);
      onDismiss();
    }, 450);
  };

  const slotLabels: Record<CheckinSlot, { label: string; time: string; badge: string }> = {
    morning: { label: 'Morning Rhythm', time: '08:30 AM', badge: 'Slot 1 of 4' },
    afternoon: { label: 'Midday Slump Check', time: '01:30 PM', badge: 'Slot 2 of 4' },
    evening: { label: 'Evening Recovery', time: '06:30 PM', badge: 'Slot 3 of 4' },
    night: { label: 'Night Tranquility', time: '10:00 PM', badge: 'Slot 4 of 4' }
  };

  const meta = slotLabels[slot];

  return (
    <div
      className="notification-banner"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        background: '#1A1B1E',
        color: '#FFFFFF',
        borderRadius: 20,
        padding: '16px 18px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        position: 'relative',
        zIndex: 90
      }}
    >
      {/* OS Banner Header */}
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
              color: '#1A1B1E'
            }}
          >
            <Sparkles size={14} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', color: '#FFFFFF' }}>
                AURA
              </span>
              <span style={{ fontSize: 11, color: '#A0A3A8', fontWeight: 500 }}>
                • {meta.label} ({meta.time})
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live response stopwatch */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 7px',
              borderRadius: 999,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: '#34D399'
            }}
            title="Elapsed response time (target: 2-3 sec)"
          >
            <Clock size={11} />
            <span>{elapsed.toFixed(1)}s</span>
          </div>

          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A0A3A8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 2
            }}
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Question Body */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#F3F4F6', lineHeight: 1.35 }}>
          {question}
        </p>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          Tap once below to record in 2–3s without opening app
        </span>
      </div>

      {/* Direct Interactive Action Row (No typing allowed) */}
      {answeredValue !== null ? (
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
          <span>Saved to local device in {elapsed.toFixed(1)}s</span>
        </div>
      ) : type === 'rating' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { val: 1, label: '1', sub: 'Low' },
            { val: 2, label: '2', sub: 'Fair' },
            { val: 3, label: '3', sub: 'Calm' },
            { val: 4, label: '4', sub: 'Good' },
            { val: 5, label: '5', sub: 'Peak' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => handleSelect(opt.val)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '9px 4px',
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.borderColor = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700 }}>{opt.label}</span>
              <span style={{ fontSize: 9, opacity: 0.75, letterSpacing: '0.02em' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => handleSelect(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '11px 14px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>No</span>
          </button>

          <button
            onClick={() => handleSelect(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '11px 14px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>Yes</span>
          </button>
        </div>
      )}
    </div>
  );
};
