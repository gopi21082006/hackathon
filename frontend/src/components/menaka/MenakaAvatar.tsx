import React from 'react';

interface MenakaAvatarProps {
  size?: number;
  isSpeaking?: boolean;
  isListening?: boolean;
  moodColor?: string;
  className?: string;
}

export const MenakaAvatar: React.FC<MenakaAvatarProps> = ({
  size = 56,
  isSpeaking = false,
  isListening = false,
  moodColor = '#10B981',
  className = ''
}) => {
  return (
    <div
      className={`menaka-avatar-container ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* Outer Glowing Ripple when speaking */}
      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: `2px solid ${moodColor}`,
            opacity: 0.7,
            animation: 'menakaSpeakingPulse 1.4s ease-out infinite'
          }}
        />
      )}

      {/* Listening Glow */}
      {isListening && (
        <div
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${moodColor}33 0%, transparent 70%)`,
            animation: 'menakaListeningGlow 1.2s ease-in-out infinite alternate'
          }}
        />
      )}

      {/* Main Avatar Circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.3)',
          boxShadow: isSpeaking
            ? `0 0 16px ${moodColor}55, 0 4px 12px rgba(0, 0, 0, 0.08)`
            : '0 4px 14px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <svg
          viewBox="0 0 80 80"
          width={size * 0.82}
          height={size * 0.82}
          style={{ overflow: 'visible' }}
        >
          {/* Soft Hair Silhouette */}
          <path
            d="M 22 46 C 20 22, 60 22, 58 46 C 58 64, 66 68, 66 74 C 66 78, 14 78, 14 74 C 14 68, 22 64, 22 46 Z"
            fill="#3B2D54"
          />

          {/* Gentle Face Shape */}
          <path
            d="M 27 34 C 27 24, 53 24, 53 34 C 53 48, 48 57, 40 57 C 32 57, 27 48, 27 34 Z"
            fill="#FDEDEC"
          />

          {/* Subtle Hair Bangs Framing Face */}
          <path
            d="M 26 31 C 32 36, 42 32, 54 31 C 49 25, 31 25, 26 31 Z"
            fill="#2D2240"
          />

          {/* Left Eye: Gentle crescent / blinking */}
          <path
            d="M 32 38 Q 35 41 38 38"
            stroke="#2D2240"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Eye: Gentle crescent */}
          <path
            d="M 42 38 Q 45 41 48 38"
            stroke="#2D2240"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Small Bindi / Forehead Blessing Dot */}
          <circle cx="40" cy="32" r="1.4" fill="#E11D48" />

          {/* Soft Cheeks Blush */}
          <circle cx="31" cy="42" r="3" fill="#F472B6" opacity="0.45" />
          <circle cx="49" cy="42" r="3" fill="#F472B6" opacity="0.45" />

          {/* Gentle Smile */}
          {isSpeaking ? (
            <path
              d="M 37 46 Q 40 51 43 46 Z"
              fill="#E11D48"
              opacity="0.85"
            />
          ) : (
            <path
              d="M 37 46 Q 40 49 43 46"
              stroke="#BE185D"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Calming Jasmine Blossom in Hair */}
          <g transform="translate(52, 28) scale(0.65)">
            <circle cx="0" cy="0" r="3" fill="#FEF08A" />
            <circle cx="-3" cy="-3" r="2.8" fill="#FFFFFF" />
            <circle cx="3" cy="-3" r="2.8" fill="#FFFFFF" />
            <circle cx="4" cy="2" r="2.8" fill="#FFFFFF" />
            <circle cx="-2" cy="4" r="2.8" fill="#FFFFFF" />
            <circle cx="-4" cy="1" r="2.8" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Small Active Speaking Waveform Overlay inside circle */}
        {isSpeaking && (
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 2,
              height: 12,
              padding: '0 4px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <span className="menaka-bar" style={{ animationDelay: '0ms' }} />
            <span className="menaka-bar" style={{ animationDelay: '150ms' }} />
            <span className="menaka-bar" style={{ animationDelay: '300ms' }} />
            <span className="menaka-bar" style={{ animationDelay: '450ms' }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes menakaSpeakingPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes menakaListeningGlow {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.18); opacity: 0.9; }
        }
        .menaka-bar {
          width: 2.5px;
          height: 10px;
          background: ${moodColor};
          border-radius: 2px;
          animation: menakaBarBounce 0.8s ease-in-out infinite alternate;
        }
        @keyframes menakaBarBounce {
          0% { height: 3px; }
          100% { height: 11px; }
        }
      `}</style>
    </div>
  );
};
