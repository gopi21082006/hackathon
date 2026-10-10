import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { signInWithGoogle, signInWithFacebook, signInWithEmail, isSupabaseConfigured } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (provider: 'google' | 'facebook' | 'email', name: string, id?: string, email?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errDesc = params.get('error_description') || params.get('error');
    if (errDesc) {
      setOauthError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
    }
  }, []);

  const clearOauthError = () => {
    setOauthError(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleGoogleClick = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google OAuth error:', error.message);
        // Fallback to local session if network or credentials blocked
        onLoginSuccess('google', 'Alex Rivera');
      }
    } else {
      // Local development fallback
      onLoginSuccess('google', 'Alex Rivera');
    }
  };

  const handleFacebookClick = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await signInWithFacebook();
      if (error) {
        console.error('Facebook OAuth error:', error.message);
        // Fallback to local session if network or credentials blocked
        onLoginSuccess('facebook', 'Alex Rivera');
      }
    } else {
      // Local development fallback
      onLoginSuccess('facebook', 'Alex Rivera');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim() || 'alex@aura.app';
    const fallbackName = cleanEmail.split('@')[0];

    if (isSupabaseConfigured()) {
      try {
        const result = await signInWithEmail(cleanEmail);
        if (result?.data?.user) {
          onLoginSuccess('email', result.data.user.name || fallbackName, result.data.user.id, cleanEmail);
          return;
        }
      } catch (err: any) {
        console.warn('Supabase Auth Notice:', err?.message);
      }
    }

    onLoginSuccess('email', fallbackName, undefined, cleanEmail);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--canvas)'
      }}
    >
      <div
        className="card-shell"
        style={{
          width: '100%',
          maxWidth: 420,
          animation: 'slideDownNotification 0.4s var(--ease-spring)'
        }}
      >
        <div className="card-core" style={{ padding: '36px 28px', textAlign: 'center' }}>
          {/* Logo Brand Mark */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: '#121314',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              margin: '0 auto 18px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            <Sparkles size={26} strokeWidth={2.2} />
          </div>

          <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 500, color: '#121314', marginBottom: 6 }}>
            Welcome to Aura
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 20, lineHeight: 1.45 }}>
            Frictionless emotional well-being tracked quietly through your phone notifications.
          </p>

          {oauthError && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                textAlign: 'left',
                fontSize: 12,
                color: '#DC2626'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
                <AlertCircle size={15} />
                <span>OAuth Login Notice</span>
              </div>
              <p style={{ margin: '0 0 10px', color: 'var(--ink-secondary)', lineHeight: 1.4, fontSize: 12 }}>
                {oauthError}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={clearOauthError}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--border-light)',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    color: 'var(--ink-primary)'
                  }}
                >
                  Dismiss & Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearOauthError();
                    onLoginSuccess('google', 'Alex Rivera');
                  }}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    background: '#121314',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                >
                  Continue in Demo Mode
                </button>
              </div>
            </div>
          )}

          {/* Social & Single-Tap Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Google */}
            <button
              onClick={handleGoogleClick}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.1C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.57l4.02 3.11c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookClick}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>

            {/* Email Option Toggle */}
            {!showEmailInput ? (
              <button
                onClick={() => setShowEmailInput(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Mail size={14} />
                <span>Or use Email / Quick Login</span>
              </button>
            ) : (
              <form onSubmit={handleEmailSubmit} style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    background: 'var(--surface-subtle)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Privacy Footnote */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 18,
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--ink-muted)'
            }}
          >
            <ShieldCheck size={13} color="#10B981" />
            <span>Local offline-first storage • Ready for cloud sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
