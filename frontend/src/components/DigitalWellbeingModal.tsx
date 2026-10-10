import React from 'react';
import { ShieldCheck, Smartphone, Check, X } from 'lucide-react';

interface DigitalWellbeingModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const DigitalWellbeingModal: React.FC<DigitalWellbeingModalProps> = ({
  isOpen,
  onAllow,
  onDeny
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16
      }}
    >
      <div
        className="card-shell"
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#FFFFFF',
          animation: 'slideDownNotification 0.3s var(--ease-spring)'
        }}
      >
        <div className="card-core" style={{ padding: '28px 22px', textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#EDF3EC',
              color: '#2C5B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Smartphone size={24} />
          </div>

          <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: '#121314', marginBottom: 8 }}>
            Usage Access Permission
          </h3>

          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.45, marginBottom: 20 }}>
            Allow <strong>Aura</strong> to read Digital Well-being screen time and app usage stats?
            <br /><br />
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Works like camera permission. Telemetry is summarized locally to reveal mood rhythms. No personal messages or history are accessed.
            </span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={onDeny}
              className="btn-secondary"
              style={{ justifyContent: 'center', borderRadius: 10, padding: '10px' }}
            >
              Don't Allow
            </button>
            <button
              onClick={onAllow}
              className="btn-primary"
              style={{ justifyContent: 'center', borderRadius: 10, padding: '10px' }}
            >
              Allow Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
