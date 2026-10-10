import React from 'react';
import { Phone, Heart, ShieldAlert, ExternalLink } from 'lucide-react';

interface CrisisSupportCardProps {
  language?: 'tamil' | 'tanglish' | 'english' | 'auto';
  onDismiss?: () => void;
}

export const CrisisSupportCard: React.FC<CrisisSupportCardProps> = ({
  language = 'auto'
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: 'linear-gradient(145deg, #FEF2F2 0%, #FEE2E2 100%)',
        border: '1.5px solid #F87171',
        borderRadius: 16,
        padding: '18px 20px',
        margin: '12px 0',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)',
        color: '#991B1B'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2
          }}
        >
          <Heart size={20} strokeWidth={2.2} fill="#FFFFFF" />
        </div>

        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: '0 0 6px 0',
              fontSize: 15,
              fontWeight: 700,
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>You Are Not Alone • நீங்கள் தனியாக இல்லை</span>
          </h4>

          <p
            style={{
              margin: '0 0 14px 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: '#7F1D1D'
            }}
          >
            {language === 'tamil' ? (
              "உங்கள் வாழ்க்கை மிகவும் மதிப்புமிக்கது. தயவுசெய்து ஒரு கணம் நின்று, உங்களுக்கு ஆதரவளிக்கக் காத்திருக்கும் இந்த இலவச மற்றும் ரகசிய உதவி எண்களை உடனடியாகத் தொடர்பு கொள்ளவும்:"
            ) : language === 'tanglish' ? (
              "Unga life romba precious. Please oru second pause pannunga, ungalukku support panna free and confidential helplines irukku. Ippove call pannunga:"
            ) : (
              "Your life has immense value. If you are feeling overwhelmed or thinking about self-harm, please connect immediately with these free, confidential crisis helplines:"
            )}
          </p>

          {/* Quick Call Emergency Helplines */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 10,
              marginBottom: 12
            }}
          >
            {/* Tele-MANAS (National 24/7) */}
            <a
              href="tel:14416"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #FECACA',
                color: '#991B1B',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#FECACA'}
            >
              <Phone size={16} color="#DC2626" />
              <div>
                <div style={{ fontSize: 13, color: '#111827' }}>Tele-MANAS (24/7)</div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>14416 / 1800-891-4416</div>
              </div>
            </a>

            {/* Sneha India (Tamil Nadu / Chennai) */}
            <a
              href="tel:04424640050"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #FECACA',
                color: '#991B1B',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#FECACA'}
            >
              <Phone size={16} color="#DC2626" />
              <div>
                <div style={{ fontSize: 13, color: '#111827' }}>Sneha Helpline (TN)</div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>044-24640050</div>
              </div>
            </a>

            {/* Vandrevala Foundation */}
            <a
              href="tel:9999666555"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #FECACA',
                color: '#991B1B',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#FECACA'}
            >
              <Phone size={16} color="#DC2626" />
              <div>
                <div style={{ fontSize: 13, color: '#111827' }}>Vandrevala Foundation</div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>9999 666 555</div>
              </div>
            </a>

            {/* International Lifeline (findahelpline) */}
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #FECACA',
                color: '#991B1B',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#FECACA'}
            >
              <ExternalLink size={16} color="#DC2626" />
              <div>
                <div style={{ fontSize: 13, color: '#111827' }}>International Helplines</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>findahelpline.com</div>
              </div>
            </a>
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#B91C1C',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ShieldAlert size={13} />
            <span>Menaka AI is a supportive companion, not a substitute for professional mental healthcare.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
