import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';

interface BreathingGuideProps {
  initialMode?: 'box' | '4-7-8';
  reducedMotion?: boolean;
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({
  initialMode = 'box',
  reducedMotion = false
}) => {
  const [mode, setMode] = useState<'box' | '4-7-8'>(initialMode);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Phases config
  // Box: Inhale 4s, Hold 4s, Exhale 4s, Rest 4s
  // 4-7-8: Inhale 4s, Hold 7s, Exhale 8s, Rest 0s
  const phases = mode === 'box'
    ? [
        { name: 'Inhale' as const, duration: 4, instruction: 'Breathe in gently through your nose' },
        { name: 'Hold' as const, duration: 4, instruction: 'Gently suspend your breath, relaxing your shoulders' },
        { name: 'Exhale' as const, duration: 4, instruction: 'Release smoothly through your mouth' },
        { name: 'Rest' as const, duration: 4, instruction: 'Rest in the natural stillness' }
      ]
    : [
        { name: 'Inhale' as const, duration: 4, instruction: 'Inhale quietly through your nose' },
        { name: 'Hold' as const, duration: 7, instruction: 'Hold the breath peacefully' },
        { name: 'Exhale' as const, duration: 8, instruction: 'Make a gentle whoosh sound as you exhale' }
      ];

  const [phaseIndex, setPhaseIndex] = useState<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPhaseSecondsLeft(prev => {
        if (prev <= 1) {
          // Advance to next phase
          const nextIndex = (phaseIndex + 1) % phases.length;
          setPhaseIndex(nextIndex);
          setPhase(phases[nextIndex].name);

          if (nextIndex === 0) {
            setCompletedCycles(c => c + 1);
          }
          return phases[nextIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phaseIndex, phases]);

  const handleToggle = () => {
    if (!isActive) {
      setPhaseIndex(0);
      setPhase(phases[0].name);
      setPhaseSecondsLeft(phases[0].duration);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setPhase(phases[0].name);
    setPhaseSecondsLeft(phases[0].duration);
    setCompletedCycles(0);
  };

  // Compute visual circle scale based on phase
  let circleScale = 1.0;
  if (phase === 'Inhale') {
    circleScale = 1.35;
  } else if (phase === 'Hold') {
    circleScale = 1.35;
  } else if (phase === 'Exhale') {
    circleScale = 0.85;
  } else {
    circleScale = 0.85;
  }

  const currentInstruction = phases[phaseIndex]?.instruction || 'Follow the rhythm';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px',
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border-light)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        maxWidth: 480,
        margin: '0 auto',
        userSelect: 'none'
      }}
    >
      {/* Mode Selector */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--surface-subtle)',
          padding: '4px',
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid var(--border-light)'
        }}
      >
        <button
          onClick={() => { setMode('box'); handleReset(); }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: mode === 'box' ? 600 : 500,
            background: mode === 'box' ? 'var(--surface)' : 'transparent',
            color: mode === 'box' ? 'var(--ink-primary)' : 'var(--ink-secondary)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: mode === 'box' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          Box Breathing (4-4-4-4)
        </button>
        <button
          onClick={() => { setMode('4-7-8'); handleReset(); }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: mode === '4-7-8' ? 600 : 500,
            background: mode === '4-7-8' ? 'var(--surface)' : 'transparent',
            color: mode === '4-7-8' ? 'var(--ink-primary)' : 'var(--ink-secondary)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: mode === '4-7-8' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          4-7-8 Relaxing Breath
        </button>
      </div>

      {/* Main Breathing Circle */}
      <div
        style={{
          position: 'relative',
          width: 240,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0 24px 0'
        }}
      >
        {/* Outer Ripple Guide */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed var(--border-light)',
            opacity: 0.6
          }}
        />

        {/* Animated Expanding/Contracting Circle */}
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #CCFBF1 0%, #99F6E4 50%, #5EEAD4 100%)',
            border: '2px solid rgba(20, 184, 166, 0.4)',
            boxShadow: isActive
              ? '0 0 32px rgba(20, 184, 166, 0.35), 0 10px 24px rgba(0, 0, 0, 0.06)'
              : '0 4px 14px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: reducedMotion ? 'none' : `scale(${isActive ? circleScale : 1.0})`,
            transition: reducedMotion
              ? 'none'
              : `transform ${phases[phaseIndex]?.duration || 4}s cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0F766E',
              letterSpacing: '-0.02em'
            }}
          >
            {isActive ? phase : 'Ready'}
          </span>

          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#115E59',
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4
            }}
          >
            {isActive ? phaseSecondsLeft : '4s'}
          </span>
        </div>
      </div>

      {/* Instruction Text */}
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-secondary)',
          textAlign: 'center',
          minHeight: 42,
          margin: '0 0 16px 0',
          maxWidth: 340,
          lineHeight: 1.5
        }}
      >
        {currentInstruction}
      </p>

      {/* Completed Cycles Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--ink-muted)',
          marginBottom: 20
        }}
      >
        <Wind size={14} color="#0D9488" />
        <span>Completed Cycles: <strong>{completedCycles}</strong></span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            background: isActive ? '#0D9488' : 'var(--ink-primary)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.2s ease'
          }}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
          <span>{isActive ? 'Pause' : 'Start Breathing'}</span>
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset breathing exercise"
          title="Reset"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-light)',
            color: 'var(--ink-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
