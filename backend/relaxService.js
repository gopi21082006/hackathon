/**
 * Relax Zone AI Service
 * 
 * Provides:
 * - Guided meditation generator (2-3 minute scripts in Tamil, Tanglish, or English)
 * - Menaka's mood-based recommendations with one-line reason
 * - AI Music (Lyria) and AI Video (Veo) provider adapters behind feature flags
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Feature flags parsed from env or defaults
export function getFeatureFlags() {
  let flags = {
    ai_music: false,
    ai_video: false
  };

  if (process.env.FEATURE_FLAGS) {
    try {
      flags = { ...flags, ...JSON.parse(process.env.FEATURE_FLAGS) };
    } catch {
      // Ignored if invalid JSON
    }
  }

  return flags;
}

/**
 * Generates a 2-3 minute guided meditation script tailored to user's mood and language
 */
export async function generateGuidedMeditation({
  mood = 'neutral',
  language = 'english',
  durationMinutes = 2
}) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const prompt = `You are Menaka AI, a warm, soothing meditation guide.
Write a gentle ${durationMinutes}-minute guided meditation script for someone experiencing the mood: "${mood}".
Target Language: "${language}" (If 'tamil', use authentic Tamil script. If 'tanglish', use Tanglish with Tamil TTS transliteration. If 'english', use serene English).

Tone: Calm, grounding, gentle cadence, mindful pauses indicated by "[pause]".
Structure:
1. Centering & posture (unclench jaw, drop shoulders)
2. Breath anchoring (gentle inhalation & long exhalation)
3. Releasing emotional tension related to "${mood}"
4. Gentle grounding return with peace

Return STRICT JSON format:
{
  "title": "Title of the meditation",
  "mood": "${mood}",
  "duration_minutes": ${durationMinutes},
  "sections": [
    { "phase": "Introduction", "text": "...", "speech_text": "..." },
    { "phase": "Breath Anchor", "text": "...", "speech_text": "..." },
    { "phase": "Release", "text": "...", "speech_text": "..." },
    { "phase": "Grounding", "text": "...", "speech_text": "..." }
  ],
  "full_speech_text": "Combined spoken meditation text with pauses for TTS",
  "menaka_affirmation": "One warm takeaway sentence"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          return JSON.parse(rawJson.trim());
        }
      }
    } catch (err) {
      console.warn('Gemini meditation generation notice:', err.message);
    }
  }

  // Fallback high-quality guided meditation scripts
  return getFallbackMeditation(mood, language, durationMinutes);
}

/**
 * Fallback guided meditation scripts
 */
function getFallbackMeditation(mood, language, durationMinutes) {
  if (language === 'tamil') {
    return {
      title: "அமைதியான உள் பயணம் (Inner Peace)",
      mood,
      duration_minutes: durationMinutes,
      sections: [
        {
          phase: "Centering",
          text: "உங்கள் கண்களை மெதுவாக மூடிக் கொள்ளுங்கள். உங்கள் தோள்களை தளர்த்தி, முகத்தில் இருக்கும் இறுக்கத்தை விடுங்கள்.",
          speech_text: "உங்கள் கண்களை மெதுவாக மூடிக் கொள்ளுங்கள். உங்கள் தோள்களை தளர்த்தி, முகத்தில் இருக்கும் இறுக்கத்தை விடுங்கள்."
        },
        {
          phase: "Breath Anchor",
          text: "மெதுவாக மூச்சை உள்ளே இழுங்கள்... ஒன்று, இரண்டு, மூன்று. மெதுவாக வெளியேற்றுங்கள். உங்கள் மூச்சின் மென்மையை உணருங்கள்.",
          speech_text: "மெதுவாக மூச்சை உள்ளே இழுங்கள். மெதுவாக வெளியேற்றுங்கள். உங்கள் மூச்சின் மென்மையை உணருங்கள்."
        },
        {
          phase: "Release",
          text: "மனதில் உள்ள கவலைகள் மற்றும் எண்ணங்கள் மேகங்களைப் போல கடந்து போகட்டும். நீங்கள் இப்போது பாதுகாப்பாகவும் அமைதியாகவும் இருக்கிறீர்கள்.",
          speech_text: "மனதில் உள்ள எண்ணங்கள் கடந்து போகட்டும். நீங்கள் இப்போது பாதுகாப்பாகவும் அமைதியாகவும் இருக்கிறீர்கள்."
        },
        {
          phase: "Grounding",
          text: "இந்த அமைதியை உங்கள் இதயத்தில் சேமித்துக் கொள்ளுங்கள். மெதுவாக உங்கள் விரல்களை அசைத்து, மெல்லிய புன்னகையோடு கண்களைத் திறக்கவும்.",
          speech_text: "இந்த அமைதியை உணருங்கள். மெல்லிய புன்னகையோடு கண்களைத் திறக்கவும்."
        }
      ],
      full_speech_text: "உங்கள் கண்களை மெதுவாக மூடிக் கொள்ளுங்கள். உங்கள் தோள்களை தளர்த்தி அமைதி பெறுங்கள். மெதுவாக மூச்சை உள்ளே இழுங்கள், மெதுவாக வெளியேற்றுங்கள். நீங்கள் இப்போது முற்றிலும் பாதுகாப்பாகவும் அமைதியாகவும் இருக்கிறீர்கள். மெல்லிய புன்னகையோடு கண்களைத் திறக்கவும்.",
      menaka_affirmation: "ஒவ்வொரு மூச்சும் உங்களுக்கு புதிய அமைதியைத் தருகிறது 🌱"
    };
  }

  if (language === 'tanglish') {
    return {
      title: "Manasa Relax Pannuvom (Tanglish Calming Walk)",
      mood,
      duration_minutes: durationMinutes,
      sections: [
        {
          phase: "Centering",
          text: "Kankalai medhuva close pannikonga. Shoulders-ah konjam loose-ah vidunga. Relax pannunga.",
          speech_text: "கண்களை மெதுவாக மூடிக் கொள்ளுங்கள். தோள்களை கொஞ்சம் தளர்த்தி ரிலாக்ஸ் பண்ணுங்க."
        },
        {
          phase: "Breath Anchor",
          text: "Medhuva oru deep breath edunga... hold pannunga... ippo smooth-ah exhale pannunga. Super.",
          speech_text: "மெதுவா ஒரு ஆழமான மூச்சு எடுங்க, இப்போ மெதுவா மூச்சை வெளியிடுங்க."
        },
        {
          phase: "Release",
          text: "Unga mind-la irukura stress and tension ellam veliya pogatum. Everything is going to be okay.",
          speech_text: "உங்க மனதில் உள்ள ஸ்ட்ரெஸ் எல்லாம் வெளியே போகட்டும். எல்லாம் சரியாகிடும்."
        },
        {
          phase: "Grounding",
          text: "Intha peacefulness-oda unga hands-ah gently move pannitu, oru cute smile-oda eyes-ah open pannunga.",
          speech_text: "இந்த அமைதியோட மெதுவா கண்களைத் திறங்க."
        }
      ],
      full_speech_text: "கண்களை மெதுவாக மூடிக் கொள்ளுங்கள். தோள்களை தளர்த்தி ரிலாக்ஸ் பண்ணுங்க. மெதுவா ஆழமான மூச்சு எடுங்க, மெதுவா வெளியேற்றுங்க. எல்லாம் சரியாகிடும். புன்னகையோடு கண்களைத் திறங்க.",
      menaka_affirmation: "Konjam pause eduthu breath pannale ellam sari aagidum ✨"
    };
  }

  // English
  return {
    title: "Grounding in the Present Moment",
    mood,
    duration_minutes: durationMinutes,
    sections: [
      {
        phase: "Centering",
        text: "Gently allow your eyelids to soften or close. Let your shoulders drop away from your ears, and loosen your jaw.",
        speech_text: "Gently allow your eyelids to soften. Let your shoulders drop away from your ears, and loosen your jaw."
      },
      {
        phase: "Breath Anchor",
        text: "Inhale gently through your nose for a count of four... hold for a brief, still moment... and release with a slow, sighing exhale.",
        speech_text: "Inhale gently through your nose. Pause for a still moment. And release with a slow, soothing exhale."
      },
      {
        phase: "Release",
        text: `Acknowledge any feelings of being ${mood}. You do not have to fight this feeling. Watch it soften like ripples settling on clear water.`,
        speech_text: `Acknowledge any feeling of being ${mood}. You do not have to fight this feeling. Watch it soften like ripples settling on clear water.`
      },
      {
        phase: "Grounding",
        text: "Bring your awareness back to the gentle touch of your hands. Take one more grounding breath, and when ready, softly open your eyes.",
        speech_text: "Bring your awareness back to this present space. Take one more grounding breath, and when you are ready, softly open your eyes."
      }
    ],
    full_speech_text: "Gently allow your eyelids to soften. Let your shoulders drop, and loosen your jaw. Inhale gently through your nose. Pause for a still moment. Release with a slow exhale. Watch the tension soften. When you are ready, softly open your eyes.",
    menaka_affirmation: "You are anchored, safe, and worthy of this peace 🌿"
  };
}

/**
 * AI Music Generator Adapter (Behind feature flag)
 */
export class AIMusicAdapter {
  async generateTrack({ mood, durationSeconds = 180 }) {
    const flags = getFeatureFlags();
    if (!flags.ai_music) {
      return {
        enabled: false,
        message: 'AI Music generation is disabled via feature flag. Using procedural Web Audio engine.'
      };
    }

    // Future Lyria / MusicLM API endpoint stub
    return {
      enabled: true,
      provider: 'lyria-prototype',
      streamUrl: null,
      message: 'Synthesized ambient stream ready'
    };
  }
}

/**
 * AI Video Generator Adapter (Behind feature flag)
 */
export class AIVideoAdapter {
  async generateCalmClip({ mood, theme }) {
    const flags = getFeatureFlags();
    if (!flags.ai_video) {
      return {
        enabled: false,
        message: 'AI Video generation is disabled via feature flag. Using procedural canvas scenes and curated videos.'
      };
    }

    // Future Veo / generative video endpoint stub
    return {
      enabled: true,
      provider: 'veo-prototype',
      clipUrl: null,
      message: 'Video rendering initiated'
    };
  }
}
