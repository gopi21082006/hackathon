import React, { useState, useEffect } from 'react';
import type { CheckinSlot, CheckinItem, DigitalWellbeingLog } from '../types';
import { localStore } from '../storage/localStore';
import { NotificationBanner } from './NotificationBanner';
import {
  Bell,
  Sun,
  Coffee,
  Sunset,
  Moon,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sliders,
  HardDrive,
  Zap,
  PieChart
} from 'lucide-react';

interface MobileAppViewProps {
  onSyncCompleted: () => void;
  activeNotification: CheckinSlot | null;
  setActiveNotification: (slot: CheckinSlot | null) => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  onSyncCompleted,
  activeNotification,
  setActiveNotification
}) => {
  const [localCheckins, setLocalCheckins] = useState<CheckinItem[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [todayWellbeing, setTodayWellbeing] = useState<DigitalWellbeingLog | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'checkins' | 'wellbeing' | 'storage'>('checkins');

  // Load local state
  const refreshLocalState = () => {
    const checkins = localStore.getCheckins();
    setLocalCheckins(checkins);
    setPermissionGranted(localStore.hasWellbeingPermission());
    const wb = localStore.saveTodayWellbeing({});
    setTodayWellbeing(wb);
  };

  useEffect(() => {
    refreshLocalState();
  }, []);

  const unsyncedCount = localCheckins.filter(c => !c.synced).length;

  const handleTriggerNotification = (slot: CheckinSlot) => {
    setActiveNotification(slot);

    // If browser supports native Notification and permission granted, fire OS notification too
    if ('Notification' in window && Notification.permission === 'granted') {
      const q = slotQuestions[slot].question;
      try {
        new Notification(`Aura Check-in: ${slotQuestions[slot].title}`, {
          body: q,
          icon: '/favicon.svg'
        });
      } catch (e) {
        // Fallback to internal banner
      }
    }
  };

  const handleRequestNativeNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        alert('Native browser notifications enabled! You can now test OS notifications.');
      }
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Syncing to Cloud Backend...');
    const res = await localStore.syncToBackend();
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusMsg(`Synced ${res.syncedCheckins} check-ins & well-being data!`);
      refreshLocalState();
      onSyncCompleted();
    } else {
      setSyncStatusMsg(`Sync failed: ${res.error || 'Server offline'}`);
    }
    setTimeout(() => setSyncStatusMsg(''), 4000);
  };

  const slotQuestions: Record<CheckinSlot, { title: string; time: string; question: string; type: 'rating' | 'boolean'; icon: any }> = {
    morning: {
      title: 'Morning Rest',
      time: '08:30 AM',
      question: 'How rested do you feel today?',
      type: 'rating',
      icon: Sun
    },
    afternoon: {
      title: 'Midday Slump',
      time: '01:30 PM',
      question: 'Are you feeling overwhelmed right now?',
      type: 'boolean',
      icon: Coffee
    },
    evening: {
      title: 'Screen Break',
      time: '06:30 PM',
      question: 'Did you step away from screens for a break today?',
      type: 'boolean',
      icon: Sunset
    },
    night: {
      title: 'Night Calm',
      time: '10:00 PM',
      question: 'How was your overall emotional calm today?',
      type: 'rating',
      icon: Moon
    }
  };

  // Find latest response for today for each slot
  const todayStr = new Date().toISOString().split('T')[0];
  const getTodaySlotAnswer = (slot: CheckinSlot) => {
    return localCheckins.find(c => c.slot === slot && c.timestamp.startsWith(todayStr));
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 395,
        margin: '0 auto',
        borderRadius: 44,
        background: '#0D0E11',
        padding: '12px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        position: 'relative'
      }}
    >
      {/* Phone Screen Outer Bezel */}
      <div
        style={{
          background: '#FBFBFA',
          borderRadius: 36,
          minHeight: 740,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid #1F2228'
        }}
      >
        {/* Dynamic Island & Status Bar */}
        <div
          style={{
            padding: '10px 24px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FBFBFA',
            zIndex: 30
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#111111' }}>
            09:41
          </span>
          <div
            style={{
              width: 106,
              height: 25,
              background: '#000000',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Aura</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#111111' }}>
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Top Floating Notification Simulator (when triggered) */}
        {activeNotification && (
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: 12,
              right: 12,
              zIndex: 100
            }}
          >
            <NotificationBanner
              slot={activeNotification}
              question={slotQuestions[activeNotification].question}
              type={slotQuestions[activeNotification].type}
              onDismiss={() => setActiveNotification(null)}
              onAnswered={() => {
                refreshLocalState();
              }}
            />
          </div>
        )}

        {/* App Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #EBEAE5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: 4 }}>
                Mobile Client
              </span>
              <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: '#111111', lineHeight: 1.1 }}>
                Daily Rhythm
              </h2>
            </div>

            <button
              onClick={() => handleTriggerNotification('morning')}
              style={{
                background: '#111111',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
              title="Test drop-down notification"
            >
              <Bell size={12} />
              <span>Test Push</span>
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#686B71', lineHeight: 1.3 }}>
            4 simple questions/day • 2–3s tap in notification • Saved locally
          </p>

          {/* Sub Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#EFEFEA',
              padding: 3,
              borderRadius: 10,
              marginTop: 12,
              gap: 2
            }}
          >
            {[
              { id: 'checkins', label: '4 Check-ins', icon: Clock },
              { id: 'wellbeing', label: 'Screen Stats', icon: PieChart },
              { id: 'storage', label: `Offline (${unsyncedCount})`, icon: HardDrive }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    color: isActive ? '#111111' : '#6E727A',
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedTab === 'checkins' && (
            <>
              {/* Notification Banner Simulator Controller */}
              <div
                style={{
                  background: '#F1F0EB',
                  borderRadius: 14,
                  padding: '12px 14px',
                  border: '1px solid #E5E3DC'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111111', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={13} color="#D97706" />
                    Simulate 3-Sec Notification
                  </span>
                  <span className="badge badge-yellow" style={{ fontSize: 10 }}>Live Demo</span>
                </div>
                <p style={{ fontSize: 11, color: '#686B71', marginBottom: 10 }}>
                  Tap any slot to fire an interactive notification banner you can answer in 2–3s without opening app:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {(['morning', 'afternoon', 'evening', 'night'] as CheckinSlot[]).map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleTriggerNotification(slot)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: '1px solid #DFDDD4',
                        background: '#FFFFFF',
                        color: '#111111',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{slot}</span>
                      <Bell size={11} color="#686B71" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Scheduled Check-in Slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888B92' }}>
                  Today's 4 Micro-Rhythms
                </span>

                {(['morning', 'afternoon', 'evening', 'night'] as CheckinSlot[]).map(slot => {
                  const cfg = slotQuestions[slot];
                  const Icon = cfg.icon;
                  const answered = getTodaySlotAnswer(slot);

                  return (
                    <div
                      key={slot}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        padding: '14px',
                        border: '1px solid #EAEAEA',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: '#F7F6F3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#111111'
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', display: 'block' }}>
                              {cfg.title}
                            </span>
                            <span style={{ fontSize: 11, color: '#8A8D93' }}>{cfg.time}</span>
                          </div>
                        </div>

                        {answered ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={11} />
                            Answered ({answered.answeredInSeconds}s)
                          </span>
                        ) : (
                          <span className="badge badge-yellow">
                            Pending
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#4B4E54', marginBottom: 10 }}>
                        {cfg.question}
                      </p>

                      {/* Display current recorded value or quick trigger button */}
                      {answered ? (
                        <div
                          style={{
                            background: '#F9F9F8',
                            borderRadius: 8,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 12
                          }}
                        >
                          <span style={{ color: '#686B71' }}>Recorded Value:</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>
                            {cfg.type === 'rating' ? `${answered.value} / 5` : answered.value ? 'Yes' : 'No'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTriggerNotification(slot)}
                          style={{
                            width: '100%',
                            padding: '7px',
                            borderRadius: 8,
                            border: '1px solid #E5E3DC',
                            background: '#FAF9F6',
                            color: '#111111',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Bell size={12} />
                          <span>Simulate Notification Action (2-3s)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {selectedTab === 'wellbeing' && (
            <>
              {/* Digital Well-being Permission Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '16px',
                  border: '1px solid #EAEAEA'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#10B981" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>
                      Well-being Telemetry
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionGranted}
                    onChange={e => {
                      setPermissionGranted(e.target.checked);
                      localStore.setWellbeingPermission(e.target.checked);
                    }}
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                </div>
                <p style={{ fontSize: 11, color: '#686B71', lineHeight: 1.4 }}>
                  Passively tracks screen time and category distribution. Strictly numerical; no keystrokes, messages or URLs are logged.
                </p>
              </div>

              {/* Today's Usage Breakdown */}
              {permissionGranted && todayWellbeing && (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '16px',
                    border: '1px solid #EAEAEA',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: '#686B71' }}>Today's Screen Time</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111111', fontFamily: 'var(--font-mono)' }}>
                      {Math.floor(todayWellbeing.totalScreenTimeMinutes / 60)}h {todayWellbeing.totalScreenTimeMinutes % 60}m
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                    <div style={{ background: '#FBFBFA', padding: '8px 10px', borderRadius: 8 }}>
                      <span style={{ color: '#888B92', display: 'block' }}>Screen Pickups</span>
                      <strong style={{ fontSize: 14 }}>{todayWellbeing.pickupsCount} times</strong>
                    </div>
                    <div style={{ background: '#FBFBFA', padding: '8px 10px', borderRadius: 8 }}>
                      <span style={{ color: '#888B92', display: 'block' }}>Late-Night (&gt;10pm)</span>
                      <strong style={{ fontSize: 14, color: todayWellbeing.lateNightScreenMinutes > 30 ? '#DC2626' : '#111111' }}>
                        {todayWellbeing.lateNightScreenMinutes}m
                      </strong>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111111', marginTop: 4 }}>
                    Category Breakdown
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { name: 'Productivity & Work', mins: todayWellbeing.categories.productivity, color: '#10B981' },
                      { name: 'Social Media', mins: todayWellbeing.categories.social, color: '#F59E0B' },
                      { name: 'Entertainment & Video', mins: todayWellbeing.categories.entertainment, color: '#6366F1' },
                      { name: 'Communication', mins: todayWellbeing.categories.communication, color: '#0EA5E9' }
                    ].map(cat => (
                      <div key={cat.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                          <span>{cat.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{cat.mins}m</span>
                        </div>
                        <div style={{ height: 5, background: '#EFEFEA', borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (cat.mins / todayWellbeing.totalScreenTimeMinutes) * 100)}%`,
                              background: cat.color,
                              height: '100%',
                              borderRadius: 999
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {selectedTab === 'storage' && (
            <>
              {/* Local Storage Inspector */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '16px',
                  border: '1px solid #EAEAEA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={18} color="#6366F1" />
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>
                      On-Device Offline Storage
                    </h3>
                    <span style={{ fontSize: 11, color: '#888B92' }}>
                      Responses written locally first before any network
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <div style={{ background: '#F7F6F3', padding: '10px', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: '#686B71', display: 'block' }}>Local Records</span>
                    <strong style={{ fontSize: 16 }}>{localCheckins.length}</strong>
                  </div>
                  <div style={{ background: '#F7F6F3', padding: '10px', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: '#686B71', display: 'block' }}>Pending Sync</span>
                    <strong style={{ fontSize: 16, color: unsyncedCount > 0 ? '#D97706' : '#10B981' }}>
                      {unsyncedCount}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Data to Cloud Backend'}</span>
                </button>

                {syncStatusMsg && (
                  <p style={{ fontSize: 11, textAlign: 'center', color: '#10B981', fontWeight: 500 }}>
                    {syncStatusMsg}
                  </p>
                )}
              </div>

              {/* Native Notification Prompt */}
              <button
                onClick={handleRequestNativeNotifications}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Bell size={13} />
                <span>Enable Native Browser Notifications</span>
              </button>
            </>
          )}
        </div>

        {/* Sync Footer Banner */}
        <div
          style={{
            padding: '10px 18px',
            background: '#F1F0EB',
            borderTop: '1px solid #E5E3DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="live-dot" />
            <span style={{ color: '#4B4E54' }}>
              {unsyncedCount > 0 ? `${unsyncedCount} pending sync` : 'All local data synced'}
            </span>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#111111',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RefreshCw size={11} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};
