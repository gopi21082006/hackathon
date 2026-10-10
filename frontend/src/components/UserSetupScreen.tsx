import React, { useState } from 'react';
import type { UserProfile } from '../types';

import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface UserSetupScreenProps {
  onSetupComplete: (lifestyle: UserProfile['lifestyle']) => void;
}

export const UserSetupScreen: React.FC<UserSetupScreenProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [lifestyle, setLifestyle] = useState<UserProfile['lifestyle']>({
    student: 'Yes',
    gym: 'Regularly',
    sports: 'Weekends',
    work: 'Remote',
    hobbies: ['Music', 'Reading']
  });

  const questions = [
    {
      key: 'student',
      title: 'Are you currently a student?',
      subtitle: 'Helps balance study focus against digital distractions.',
      options: [
        { label: 'Yes, full-time student', value: 'Yes', emoji: '🎓' },
        { label: 'Pursuing / part-time', value: 'Pursuing', emoji: '📚' },
        { label: 'No, not studying', value: 'No', emoji: '💼' }
      ]
    },
    {
      key: 'gym',
      title: 'Do you go to the gym?',
      subtitle: 'Physical exercise strongly anchors emotional calm.',
      options: [
        { label: 'Regularly (3+ days/week)', value: 'Regularly', emoji: '🏋️' },
        { label: 'Occasionally', value: 'Occasionally', emoji: '🏃' },
        { label: 'No gym routine', value: 'No', emoji: '🧘' }
      ]
    },
    {
      key: 'sports',
      title: 'Do you play outdoor sports?',
      subtitle: 'Active play refreshes digital cognitive strain.',
      options: [
        { label: 'Active & frequent', value: 'Active', emoji: '⚽' },
        { label: 'Weekends / casual', value: 'Weekends', emoji: '🏸' },
        { label: 'Rarely / leisure walks', value: 'Rarely', emoji: '🚶' }
      ]
    },
    {
      key: 'work',
      title: 'What is your work environment?',
      subtitle: 'Calibrates daytime productivity rhythms.',
      options: [
        { label: 'Full-time onsite', value: 'Full-time', emoji: '🏢' },
        { label: 'Remote / hybrid desk', value: 'Remote', emoji: '💻' },
        { label: 'Freelance & flexible', value: 'Freelance', emoji: '☕' },
        { label: 'None currently', value: 'None', emoji: '🌿' }
      ]
    },
    {
      key: 'hobbies',
      title: 'Which hobbies recharge you most?',
      subtitle: 'Select one or more creative outlets.',
      isMulti: true,
      options: [
        { label: 'Music & Audio', value: 'Music', emoji: '🎵' },
        { label: 'Reading & Literature', value: 'Reading', emoji: '📖' },
        { label: 'Art, Design & Craft', value: 'Art', emoji: '🎨' },
        { label: 'Gaming & Interactive', value: 'Gaming', emoji: '🎮' },
        { label: 'Nature & Outdoors', value: 'Outdoors', emoji: '🌲' },
        { label: 'Cooking & Culinary', value: 'Cooking', emoji: '🍳' }
      ]
    }
  ];

  const currentQ = questions[step];

  const handleSelectOption = (val: string) => {
    if (currentQ.isMulti) {
      const currentHobbies = [...lifestyle.hobbies];
      const index = currentHobbies.indexOf(val);
      if (index >= 0) {
        currentHobbies.splice(index, 1);
      } else {
        currentHobbies.push(val);
      }
      setLifestyle({ ...lifestyle, hobbies: currentHobbies });
    } else {
      const updated = { ...lifestyle, [currentQ.key]: val };
      setLifestyle(updated);
      // Auto advance to next question smoothly
      if (step < questions.length - 1) {
        setStep(step + 1);
      }
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onSetupComplete(lifestyle);
    }
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
          maxWidth: 480,
          animation: 'slideDownNotification 0.35s var(--ease-spring)'
        }}
      >
        <div className="card-core" style={{ padding: '32px 26px' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>
              Step {step + 1} of {questions.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {questions.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 22 : 6,
                    height: 6,
                    borderRadius: 999,
                    background: i <= step ? '#121314' : 'var(--border-light)',
                    transition: 'all 0.25s var(--ease-spring)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Question Title & Subtitle */}
          <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink-primary)', lineHeight: 1.25, marginBottom: 6 }}>
            {currentQ.title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 22 }}>
            {currentQ.subtitle}
          </p>

          {/* Selectable Cards Options (Zero text-heavy forms!) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {currentQ.options.map(opt => {
              const isSelected = currentQ.isMulti
                ? lifestyle.hobbies.includes(opt.value)
                : (lifestyle as any)[currentQ.key] === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectOption(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: isSelected ? '2px solid #121314' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s var(--ease-spring)',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: 'var(--ink-primary)' }}>
                      {opt.label}
                    </span>
                  </div>

                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '1.5px solid var(--border-light)',
                      background: isSelected ? '#121314' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{ padding: '10px 20px', marginLeft: 'auto' }}
            >
              <span>{step === questions.length - 1 ? 'Open Main Dashboard' : 'Next'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
