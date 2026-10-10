import React from 'react';

interface PandaAssistantProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

export const PandaAssistant: React.FC<PandaAssistantProps> = ({ isOpen, onClick, hasUnread }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8
      }}
    >
      {/* Speech bubble / invitation badge when closed */}
      {!isOpen && (
        <div
          onClick={onClick}
          style={{
            cursor: 'pointer',
            background: 'var(--surface)',
            color: 'var(--ink-primary)',
            padding: '6px 12px',
            borderRadius: 14,
            fontSize: 12,
            fontWeight: 500,
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            animation: 'chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'bottom right'
          }}
        >
          <span style={{ fontSize: 13 }}>🌱</span>
          <span>I'm right here with you</span>
        </div>
      )}

      {/* Floating Circular Panda Button */}
      <button
        onClick={onClick}
        className="panda-companion-btn"
        aria-label="Open AI Emotional Companion Chat"
        title="Chat with your Panda Companion"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--border-light)',
          background: 'var(--surface)',
          boxShadow: isOpen
            ? '0 0 0 4px rgba(16, 185, 129, 0.25), 0 10px 28px rgba(0, 0, 0, 0.16)'
            : '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          outline: 'none'
        }}
      >
        {/* Cute Panda Avatar SVG */}
        <svg
          viewBox="0 0 100 100"
          width="50"
          height="50"
          style={{ overflow: 'visible' }}
        >
          {/* Panda Left Ear */}
          <circle cx="23" cy="24" r="14" fill="#18181B" />
          <circle cx="24" cy="24" r="7" fill="#F472B6" opacity="0.35" />

          {/* Panda Right Ear */}
          <circle cx="77" cy="24" r="14" fill="#18181B" />
          <circle cx="76" cy="24" r="7" fill="#F472B6" opacity="0.35" />

          {/* Panda Head Base */}
          <circle cx="50" cy="54" r="38" fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="1.5" />

          {/* Tiny Green Sprout on Head */}
          <g transform="translate(46, 12)">
            <path
              d="M4,10 C4,5 1,1 -3,1 C-3,6 0,10 4,10 Z"
              fill="#10B981"
            />
            <path
              d="M4,10 C4,5 7,1 11,1 C11,6 8,10 4,10 Z"
              fill="#34D399"
            />
            <path
              d="M4,10 L4,14"
              stroke="#059669"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>

          {/* Left Eye Dark Patch (Rotated Oval) */}
          <ellipse
            cx="34"
            cy="52"
            rx="11"
            ry="13"
            fill="#18181B"
            transform="rotate(18, 34, 52)"
          />

          {/* Right Eye Dark Patch (Rotated Oval) */}
          <ellipse
            cx="66"
            cy="52"
            rx="11"
            ry="13"
            fill="#18181B"
            transform="rotate(-18, 66, 52)"
          />

          {/* Blinking Eyes Group */}
          <g style={{ transformOrigin: '50px 52px', animation: 'pandaBlink 4.2s infinite ease-in-out' }}>
            {/* Left Eye Sparkle */}
            <circle cx="34" cy="52" r="5" fill="#FFFFFF" />
            <circle cx="36" cy="50" r="2.2" fill="#FFFFFF" />

            {/* Right Eye Sparkle */}
            <circle cx="66" cy="52" r="5" fill="#FFFFFF" />
            <circle cx="68" cy="50" r="2.2" fill="#FFFFFF" />
          </g>

          {/* Soft Blush Cheeks */}
          <ellipse cx="22" cy="62" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.65" />
          <ellipse cx="78" cy="62" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.65" />

          {/* Tiny Panda Nose */}
          <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#18181B" />

          {/* Cute Smile */}
          <path
            d="M45,66 Q50,71 55,66"
            fill="none"
            stroke="#18181B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Live Active Companion Dot */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#10B981',
            border: '2px solid var(--surface)',
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
          }}
        />
      </button>
    </div>
  );
};
