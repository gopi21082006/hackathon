import React from 'react';
import type { UserProfile } from '../types';
import { Sun, Moon, LogOut, ShieldCheck, User } from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  currentTheme,
  onThemeChange,
  onLogout
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28
      }}
    >
      {/* Settings Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: 20
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '3px 9px',
            borderRadius: 9999,
            background: 'var(--surface-subtle)',
            color: 'var(--ink-secondary)',
            display: 'inline-block',
            marginBottom: 6
          }}
        >
          Preferences & Account
        </span>
        <h1
          className="font-serif"
          style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink-primary)', lineHeight: 1.2 }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
          Manage your interface appearance and active Supabase session.
        </p>
      </header>

      {/* 1. Theme Configuration Card */}
      <div className="card-shell">
        <div className="card-core" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-primary)' }}>
              Appearance & Theme
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2 }}>
              Choose your preferred visual atmosphere. Your selection automatically persists across browser refreshes.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginTop: 6
            }}
          >
            {/* Light Option */}
            <button
              onClick={() => onThemeChange('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                border: currentTheme === 'light'
                  ? '2px solid var(--ink-primary)'
                  : '1px solid var(--border-light)',
                background: currentTheme === 'light' ? 'var(--surface-subtle)' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#FBF3DB',
                  color: '#8C5D00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sun size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  Light Canvas
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Warm cream & soft paper feel
                </div>
              </div>
            </button>

            {/* Dark Option */}
            <button
              onClick={() => onThemeChange('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                border: currentTheme === 'dark'
                  ? '2px solid var(--ink-primary)'
                  : '1px solid var(--border-light)',
                background: currentTheme === 'dark' ? 'var(--surface-subtle)' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#2B1D3D',
                  color: '#D6BCFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Moon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  Dark Horizon
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Calm OLED slate & muted ink
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Authentication & Session Card */}
      <div className="card-shell">
        <div className="card-core" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-primary)' }}>
              Supabase Account Session
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2 }}>
              Authenticated identity linked to your encrypted personal profile.
            </p>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-primary)'
                }}
              >
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {user.email || 'alex@aura.app'} • Provider: {user.provider || 'email'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              <ShieldCheck size={14} />
              <span>RLS Protected</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 6 }}>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{
                borderRadius: 10,
                padding: '10px 20px',
                color: '#EF4444',
                borderColor: 'var(--border-light)',
                fontWeight: 600
              }}
            >
              <LogOut size={16} />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
