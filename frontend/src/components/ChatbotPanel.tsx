import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { getBearerToken } from '../lib/supabase';
import { X, Send, Sparkles, Heart, Coffee, Gift, Star, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
  gift?: {
    type?: string;
    emoji: string;
    note: string;
  };
}

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_1',
      role: 'assistant',
      text: "Hey... you're here. That's already something. 🌱 How are you feeling today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const authHeader = await getBearerToken();
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          userId: user.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          text: data.reply || "I'm right here with you. 🌱",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gift: data.gift || undefined
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      // Gentle fallback message
      const fallbackMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        role: 'assistant',
        text: "I'm right here in your corner. Take a soft breath with me... I'm listening closely. 🌱",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { label: "Feeling a bit tired today 🌧️", text: "Feeling a bit tired today..." },
    { label: "Had a nice moment ✨", text: "Had a nice moment today that made me smile." },
    { label: "Just need quiet company ☕", text: "Just wanted to say hi and have a quiet moment." },
    { label: "Send a little gift 🎁", text: "Can you send me a little virtual gift today?" }
  ];

  if (!isOpen) return null;

  return (
    <div
      className="chat-panel-animate"
      style={{
        position: 'fixed',
        bottom: 96,
        right: 24,
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
        height: 540,
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 1000,
        background: 'var(--surface)',
        borderRadius: 22,
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mini Panda Icon */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
              position: 'relative'
            }}
          >
            <svg viewBox="0 0 100 100" width="30" height="30">
              <circle cx="24" cy="25" r="14" fill="#18181B" />
              <circle cx="76" cy="25" r="14" fill="#18181B" />
              <circle cx="50" cy="54" r="38" fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="1.5" />
              <ellipse cx="34" cy="52" rx="10" ry="12" fill="#18181B" transform="rotate(18, 34, 52)" />
              <ellipse cx="66" cy="52" rx="10" ry="12" fill="#18181B" transform="rotate(-18, 66, 52)" />
              <circle cx="34" cy="52" r="4.5" fill="#FFFFFF" />
              <circle cx="66" cy="52" r="4.5" fill="#FFFFFF" />
              <ellipse cx="23" cy="62" rx="6" ry="4" fill="#FDA4AF" opacity="0.65" />
              <ellipse cx="77" cy="62" rx="6" ry="4" fill="#FDA4AF" opacity="0.65" />
              <ellipse cx="50" cy="61" rx="4" ry="3" fill="#18181B" />
              <path d="M46,66 Q50,70 54,66" fill="none" stroke="#18181B" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                border: '1.5px solid var(--surface)'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Aura Companion</span>
              <span style={{ fontSize: 12 }}>🌱</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              Warm Emotional AI • Always Here
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close Assistant Chat"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'var(--canvas)'
        }}
      >
        {messages.map(msg => {
          const isAI = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '88%',
                alignSelf: isAI ? 'flex-start' : 'flex-end'
              }}
            >
              {/* Message Bubble */}
              <div
                style={{
                  padding: '11px 15px',
                  borderRadius: isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  background: isAI ? 'var(--surface)' : 'var(--ink-primary)',
                  color: isAI ? 'var(--ink-primary)' : '#FFFFFF',
                  border: isAI ? '1px solid var(--border-light)' : 'none',
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  boxShadow: isAI ? '0 2px 6px rgba(0, 0, 0, 0.03)' : '0 2px 8px rgba(0, 0, 0, 0.12)',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>

              {/* Virtual Gift Card (if message includes a gift) */}
              {msg.gift && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'var(--pastel-yellow-bg)',
                    color: 'var(--pastel-yellow-text)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)'
                  }}
                >
                  <span style={{ fontSize: 22 }}>{msg.gift.emoji}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Gift for You
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      {msg.gift.note}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--ink-muted)',
                  marginTop: 4,
                  padding: '0 4px'
                }}
              >
                {msg.time}
              </span>
            </div>
          );
        })}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              alignSelf: 'flex-start',
              width: 'fit-content'
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: '#10B981', animationDuration: '0.8s' }} />
              <span className="live-dot" style={{ width: 6, height: 6, background: '#F59E0B', animationDuration: '1.2s' }} />
              <span className="live-dot" style={{ width: 6, height: 6, background: '#6366F1', animationDuration: '1.6s' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              Panda is listening warmly...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.text)}
            disabled={isLoading}
            style={{
              padding: '5px 10px',
              borderRadius: 9999,
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-light)',
              color: 'var(--ink-secondary)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--ink-primary)';
              e.currentTarget.style.borderColor = 'var(--ink-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--ink-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share a feeling, thought, or moment..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            background: 'var(--canvas)',
            color: 'var(--ink-primary)',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          aria-label="Send Message"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: 'none',
            background: inputText.trim() && !isLoading ? 'var(--ink-primary)' : 'var(--surface-hover)',
            color: inputText.trim() && !isLoading ? '#FFFFFF' : 'var(--ink-muted)',
            cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
