/**
 * Moods Configuration: Single source of truth for emotional states,
 * visual styles, ambient presets, game recommendations, and Menaka's tone.
 */

export type MoodType = 'happy' | 'sad' | 'anxious' | 'stressed' | 'angry' | 'tired' | 'neutral';

export interface MoodPreset {
  id: MoodType;
  label: string;
  labelTa: string;
  labelTanglish: string;
  emoji: string;
  colors: {
    primary: string;
    accent: string;
    subtleBg: string;
    cardBorder: string;
    gradient: string;
  };
  recommendedGame: {
    gameId: 'breathing' | 'bubble_pop' | 'zen_sand' | 'color_calm';
    title: string;
    difficulty: 'gentle' | 'easy' | 'medium';
    reasonEn: string;
    reasonTa: string;
    reasonTanglish: string;
  };
  audioPreset: {
    id: string;
    name: string;
    layers: {
      rain: number;       // 0 to 1
      ocean: number;      // 0 to 1
      softPads: number;   // 0 to 1
      binaural: number;   // 0 to 1
    };
    description: string;
  };
  visualScene: {
    type: 'aurora' | 'particles' | 'waves' | 'starfield';
    speed: number;
    colorPalette: string[];
    density: number;
  };
  menakaTone: {
    greetingEn: string;
    greetingTa: string;
    greetingTanglish: string;
    affirmationEn: string;
    affirmationTa: string;
    affirmationTanglish: string;
  };
}

export const MOODS_CONFIG: Record<MoodType, MoodPreset> = {
  happy: {
    id: 'happy',
    label: 'Joyful & Happy',
    labelTa: 'மகிழ்ச்சி & அமைதி',
    labelTanglish: 'Santhosham & Happy',
    emoji: '✨',
    colors: {
      primary: '#D97706',
      accent: '#F59E0B',
      subtleBg: 'rgba(245, 158, 11, 0.08)',
      cardBorder: 'rgba(245, 158, 11, 0.25)',
      gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
    },
    recommendedGame: {
      gameId: 'color_calm',
      title: 'Color by Calm',
      difficulty: 'easy',
      reasonEn: 'Celebrating your bright mood with joyful harmonic color puzzles.',
      reasonTa: 'உங்கள் மகிழ்ச்சியான மனநிலையைக் கொண்டாட மென்மையான வண்ண புதிர்கள்.',
      reasonTanglish: 'Unga jolly mood-ku innum colorful vibes kudukka intha game super!'
    },
    audioPreset: {
      id: 'golden_glow',
      name: 'Golden Morning Pads',
      layers: { rain: 0, ocean: 0.2, softPads: 0.7, binaural: 0.1 },
      description: 'Warm, uplifting harmonic frequencies.'
    },
    visualScene: {
      type: 'particles',
      speed: 1.2,
      colorPalette: ['#F59E0B', '#FBBF24', '#FCD34D', '#F43F5E'],
      density: 45
    },
    menakaTone: {
      greetingEn: 'I see that radiant energy today! 🌟 Keep holding this gentle glow.',
      greetingTa: 'உங்கள் முகத்தில் ஒரு அழகான புன்னகையைப் பார்க்கிறேன்! 🌟',
      greetingTanglish: 'Semma glow unga face-la iniku! 🌟 Intha energy-ah maintain pannuvom.',
      affirmationEn: 'Your joy radiates and brings light to everyone around you.',
      affirmationTa: 'உங்கள் மகிழ்ச்சி உங்களைச் சுற்றியுள்ளவர்களுக்கும் ஒளியைத் தருகிறது.',
      affirmationTanglish: 'Unga sandhosham ungalukum suthirukuravangalukum periya positive energy.'
    }
  },

  sad: {
    id: 'sad',
    label: 'Low & Tender',
    labelTa: 'மனச்சோர்வு & பாரம்',
    labelTanglish: 'Sogam & Low',
    emoji: '🌱',
    colors: {
      primary: '#4F46E5',
      accent: '#6366F1',
      subtleBg: 'rgba(99, 102, 241, 0.08)',
      cardBorder: 'rgba(99, 102, 241, 0.25)',
      gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
    },
    recommendedGame: {
      gameId: 'zen_sand',
      title: 'Zen Sand Garden',
      difficulty: 'gentle',
      reasonEn: 'Slow, freeform meditative sand raking to gently soothe heavy thoughts.',
      reasonTa: 'பாரமான எண்ணங்களை மெதுவாக்க மென்மையான ஜென் மணல் கலை.',
      reasonTanglish: 'Heavy thoughts-ah slow-down panna meditative zen sand drawing romba soothing.'
    },
    audioPreset: {
      id: 'healing_rain',
      name: 'Gentle Droplets & Warm Pads',
      layers: { rain: 0.6, ocean: 0.1, softPads: 0.8, binaural: 0.3 },
      description: 'Warm, tender sonic embrace with rain.'
    },
    visualScene: {
      type: 'aurora',
      speed: 0.5,
      colorPalette: ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'],
      density: 30
    },
    menakaTone: {
      greetingEn: 'I’m right here beside you. You don’t have to carry this alone 🌱',
      greetingTa: 'நான் உங்களுடன் இருக்கிறேன். நீங்கள் தனியாக இல்லை 🌱',
      greetingTanglish: 'Kavalapadatheenga friend, naan unga kooda irukken 🌱',
      affirmationEn: 'Honor your heart. Healing takes soft, unhurried time.',
      affirmationTa: 'உங்கள் இதயத்திற்கு ஓய்வு கொடுங்கள். அமைதி மெதுவாகத் திரும்பும்.',
      affirmationTanglish: 'Unga manasukku konjam time kudunga, ellam kandippa sariyagum.'
    }
  },

  anxious: {
    id: 'anxious',
    label: 'Anxious & Restless',
    labelTa: 'பதட்டம் & அமைதியின்மை',
    labelTanglish: 'Padhattam & Anxious',
    emoji: '🍃',
    colors: {
      primary: '#0D9488',
      accent: '#14B8A6',
      subtleBg: 'rgba(20, 184, 166, 0.08)',
      cardBorder: 'rgba(20, 184, 166, 0.25)',
      gradient: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)'
    },
    recommendedGame: {
      gameId: 'breathing',
      title: 'Box Breathing Guide',
      difficulty: 'gentle',
      reasonEn: 'Slow 4-4-4-4 rhythmic breathing instantly downregulates your nervous system.',
      reasonTa: '4-4-4-4 சீரான சுவாசப் பயிற்சி உடனே நரம்புகளை அமைதிப்படுத்தும்.',
      reasonTanglish: '4-4-4-4 box breathing unga nervous system-ah udaney calm down pannum.'
    },
    audioPreset: {
      id: 'alpha_binaural',
      name: 'Alpha 10Hz Calming Waves',
      layers: { rain: 0.3, ocean: 0.5, softPads: 0.4, binaural: 0.8 },
      description: 'Binaural beats calibrated to slow racing thoughts.'
    },
    visualScene: {
      type: 'waves',
      speed: 0.6,
      colorPalette: ['#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4'],
      density: 35
    },
    menakaTone: {
      greetingEn: 'Take a soft pause with me 🌿 Let’s unclench your jaw and slow down.',
      greetingTa: 'என்னுடம் ஒரு மெல்லிய மூச்சு எடுங்கள் 🌿 பதட்டம் குறையட்டும்.',
      greetingTanglish: 'Oru second pause pannunga 🌿 Shoulders-ah relax pannitu breath edupom.',
      affirmationEn: 'You are safe in this present breath. One minute at a time.',
      affirmationTa: 'இந்த நொடியில் நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள்.',
      affirmationTanglish: 'Intha second-la neenga completely safe. Ovoru step-ah paapom.'
    }
  },

  stressed: {
    id: 'stressed',
    label: 'Stressed & Overloaded',
    labelTa: 'அழுத்தம் & பணிச்சுமை',
    labelTanglish: 'Stress & Tension',
    emoji: '☕',
    colors: {
      primary: '#EA580C',
      accent: '#F97316',
      subtleBg: 'rgba(249, 115, 22, 0.08)',
      cardBorder: 'rgba(249, 115, 22, 0.25)',
      gradient: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)'
    },
    recommendedGame: {
      gameId: 'bubble_pop',
      title: 'Satisfying Bubble Pop',
      difficulty: 'easy',
      reasonEn: 'Tactile stress release popping bubbles with haptic micro-relief.',
      reasonTa: 'அழுத்தத்தைக் குறைக்கும் மென்மையான குமிழ்களை வெடிக்கும் விளையாட்டு.',
      reasonTanglish: 'Screen-la irukura bubbles-ah pop panni stress-ah release pannunga.'
    },
    audioPreset: {
      id: 'ocean_surge',
      name: 'Deep Ocean & Low Tide',
      layers: { rain: 0.1, ocean: 0.8, softPads: 0.5, binaural: 0.4 },
      description: 'Deep resonant ocean frequencies to wash away stress.'
    },
    visualScene: {
      type: 'aurora',
      speed: 0.7,
      colorPalette: ['#EA580C', '#F97316', '#FB923C', '#FDBA74'],
      density: 40
    },
    menakaTone: {
      greetingEn: 'You’ve carried quite a heavy backpack today ☕ Let’s set it down.',
      greetingTa: 'இன்று நீங்கள் அதிக சுமையைச் சுமந்துவிட்டீர்கள் ☕ அதை கீழே வைப்போம்.',
      greetingTanglish: 'Iniku romba heavy load eduthuteenga pola ☕ Konjam drop pannuvom.',
      affirmationEn: 'Not everything is urgent. Your peace is the highest priority.',
      affirmationTa: 'எல்லாவற்றையும் விட உங்கள் மன அமைதி தான் மிக முக்கியமானது.',
      affirmationTanglish: 'Unga mental peace thaan number one priority, remember that.'
    }
  },

  angry: {
    id: 'angry',
    label: 'Irritated & Frustrated',
    labelTa: 'கோபம் & எரிச்சல்',
    labelTanglish: 'Kovam & Frustrated',
    emoji: '🔥',
    colors: {
      primary: '#DC2626',
      accent: '#EF4444',
      subtleBg: 'rgba(239, 68, 68, 0.08)',
      cardBorder: 'rgba(239, 68, 68, 0.25)',
      gradient: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
    },
    recommendedGame: {
      gameId: 'bubble_pop',
      title: 'Fast Bubble Pop',
      difficulty: 'medium',
      reasonEn: 'Channel agitated physical energy into rapid, satisfying bubble popping.',
      reasonTa: 'கோபமான ஆற்றலை அமைதியாக்க விரைவான குமிழி வெடிப்பு.',
      reasonTanglish: 'Agitated energy-ah release panna fast bubble pop best-ah help pannum.'
    },
    audioPreset: {
      id: 'thunder_rain',
      name: 'Cooling Rain & Deep Frequencies',
      layers: { rain: 0.8, ocean: 0.3, softPads: 0.3, binaural: 0.5 },
      description: 'Cooling atmospheric downpour to temper hot emotion.'
    },
    visualScene: {
      type: 'waves',
      speed: 0.9,
      colorPalette: ['#EF4444', '#F87171', '#FCA5A5', '#7F1D1D'],
      density: 50
    },
    menakaTone: {
      greetingEn: 'It is natural to feel upset 🍃 Let’s channel that fire into breath.',
      greetingTa: 'கோபம் வருவது இயல்பு தான் 🍃 அதை மூச்சின் மூலம் வெளியேற்றுங்கள்.',
      greetingTanglish: 'Kovam varaathula thappe illa 🍃 Deep breath eduthu cool aaguvom.',
      affirmationEn: 'You are in control of your response. Breathe out the storm.',
      affirmationTa: 'புயலை அமைதியாக்கும் சக்தி உங்கள் மூச்சில் இருக்கிறது.',
      affirmationTanglish: 'Storm-ah cool down panna ungalala mudiyum. Long breath out.'
    }
  },

  tired: {
    id: 'tired',
    label: 'Tired & Sleepy',
    labelTa: 'களைப்பு & உறக்கம்',
    labelTanglish: 'Tired & Sleepy',
    emoji: '🌙',
    colors: {
      primary: '#7C3AED',
      accent: '#8B5CF6',
      subtleBg: 'rgba(139, 92, 246, 0.08)',
      cardBorder: 'rgba(139, 92, 246, 0.25)',
      gradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)'
    },
    recommendedGame: {
      gameId: 'zen_sand',
      title: 'Gentle Sand Flow',
      difficulty: 'gentle',
      reasonEn: 'Zero-effort slow lines on soft sand to lull your mind toward restful sleep.',
      reasonTa: 'மனதை உறக்கத்திற்கு தயார்படுத்தும் அமைதியான மணல் அசைவுகள்.',
      reasonTanglish: 'Zero stress-oda thoongura munadi gentle lines draw panna soothing.'
    },
    audioPreset: {
      id: 'night_pads',
      name: 'Delta Sleep Pads & Night Rain',
      layers: { rain: 0.5, ocean: 0.2, softPads: 0.9, binaural: 0.6 },
      description: 'Ultra-low delta frequencies promoting deep restorative rest.'
    },
    visualScene: {
      type: 'starfield',
      speed: 0.3,
      colorPalette: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E0E7FF'],
      density: 60
    },
    menakaTone: {
      greetingEn: 'You’ve given all you could today 🌙 Rest now without any hesitation.',
      greetingTa: 'இன்றைய நாளுக்கான உழைப்பு முடிந்தது 🌙 இப்போது நிம்மதியாக உறங்குங்கள்.',
      greetingTanglish: 'Iniku nallave work panniteenga 🌙 Ippo guilt illama nalla thoongunga.',
      affirmationEn: 'Sleep is sacred restoration. Let every muscle melt into peace.',
      affirmationTa: 'உறக்கம் உங்கள் உடலையும் மனதையும் புதுப்பிக்கும் அமுதம்.',
      affirmationTanglish: 'Thookam unga body-ku thevaiyana sacred rest. Nalla rest edunga.'
    }
  },

  neutral: {
    id: 'neutral',
    label: 'Calm & Centered',
    labelTa: 'அமைதி & சமநிலை',
    labelTanglish: 'Neutral & Calm',
    emoji: '🌸',
    colors: {
      primary: '#059669',
      accent: '#10B981',
      subtleBg: 'rgba(16, 185, 129, 0.08)',
      cardBorder: 'rgba(16, 185, 129, 0.25)',
      gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
    },
    recommendedGame: {
      gameId: 'breathing',
      title: '4-7-8 Centering Breath',
      difficulty: 'gentle',
      reasonEn: 'Classic 4-7-8 pranayama to maintain your balanced mental baseline.',
      reasonTa: 'மன சமநிலையை நீடிக்கச் செய்யும் 4-7-8 சுவாசப் பயிற்சி.',
      reasonTanglish: 'Unga balanced mindset-ah maintain panna 4-7-8 breathing perfect.'
    },
    audioPreset: {
      id: 'zen_garden',
      name: 'Forest Rain & Soft Chords',
      layers: { rain: 0.4, ocean: 0.3, softPads: 0.6, binaural: 0.2 },
      description: 'Harmonious balance of organic earth sounds.'
    },
    visualScene: {
      type: 'particles',
      speed: 0.5,
      colorPalette: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
      density: 35
    },
    menakaTone: {
      greetingEn: 'Peaceful balance is a lovely state 🌸 How may we nourish it today?',
      greetingTa: 'மன சமநிலை என்பது ஒரு அழகான பரிசு 🌸 இன்று அதை கொண்டாடுவோம்.',
      greetingTanglish: 'Balanced-ah irukuradhu super 🌸 Iniku ethavathu relax panna virumbureengala?',
      affirmationEn: 'When you are centered within, the entire world flows with you.',
      affirmationTa: 'உங்கள் உள்ளம் அமைதியாக இருக்கும்போது உலகமும் இனிமையாக இருக்கும்.',
      affirmationTanglish: 'Mind calm-ah iruntha, ellam smooth-ah flow aagum.'
    }
  }
};
